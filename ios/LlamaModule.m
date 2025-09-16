#import "LlamaModule.h"
#import <Capacitor/Capacitor.h>
#import "llama.h" // Path to llama.cpp/include/llama.h

static llama_context *g_ctx = NULL; // Global context to persist across calls

@implementation LlamaModule

CAP_PLUGIN(LlamaModule, "ChatbotNative",
           CAP_PLUGIN_METHOD(initialize, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(generate, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(getModelStatus, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(cleanup, CAPPluginReturnPromise);
)

- (void)initialize:(CAPPluginCall *)call {
    NSString *modelPath = [call getString:@"modelPath"];
    // Load model
    const char *cModelPath = [modelPath UTF8String];
    llama_context_params params = llama_context_default_params();
    params.n_ctx = 2048; // Context length
    params.n_gpu_layers = 1; // Use Metal for Apple Silicon if available
    params.seed = 1234; // Fixed seed for reproducibility

    struct llama_model *model = llama_load_model_from_file(cModelPath, params);
    if (!model) {
        [call reject:@"error" withMessage:@"Failed to load model file" withError:nil];
        return;
    }

    g_ctx = llama_new_context_with_model(model, params);
    if (!g_ctx) {
        llama_free_model(model);
        [call reject:@"error" withMessage:@"Failed to create context" withError:nil];
    } else {
        [call resolve:@{@"success": @(YES)}];
    }
}

- (void)generate:(CAPPluginCall *)call {
    NSString *prompt = [call getString:@"prompt"];
    NSNumber *maxTokens = [call getNumber:@"maxTokens" defaultValue:@100];
    
    if (!g_ctx) {
        [call reject:@"error" withMessage:@"Model not initialized" withError:nil];
        return;
    }

    const char *cPrompt = [prompt UTF8String];
    int n_predict = [maxTokens intValue]; // Maximum tokens to generate

    // Tokenize the input prompt
    std::vector<llama_token> tokens(llama_n_ctx(g_ctx));
    int n_tokens = llama_tokenize(g_ctx, cPrompt, strlen(cPrompt), tokens.data(), tokens.size(), true);
    if (n_tokens < 0) {
        [call reject:@"error" withMessage:@"Tokenization failed" withError:nil];
        return;
    }

    // Prepare output
    std::string output;
    tokens.resize(n_tokens);

    // Generate text
    for (int i = 0; i < n_predict; i++) {
        // Evaluate the current context
        if (llama_eval(g_ctx, tokens.data(), n_tokens, i, 1)) {
            [call reject:@"error" withMessage:@"Evaluation failed" withError:nil];
            return;
        }

        // Sample the next token
        llama_token new_token = llama_sample_top_p_top_k(g_ctx, tokens.data(), n_tokens, 50, 0.8f, 0.0f, 1.0f);
        tokens.push_back(new_token);

        // Convert token to string
        const char *token_str = llama_token_to_str(g_ctx, new_token);
        output += token_str;

        // Check for stop condition (e.g., end of sequence)
        if (new_token == llama_token_eos(g_ctx)) {
            break;
        }
    }

    // Return the generated text
    [call resolve:@{@"response": [NSString stringWithUTF8String:output.c_str()]}];
}

- (void)getModelStatus:(CAPPluginCall *)call {
    BOOL loaded = (g_ctx != NULL);
    NSNumber *modelSize = @0; // Would need to track actual model size
    [call resolve:@{@"loaded": @(loaded), @"modelSize": modelSize}];
}

- (void)cleanup:(CAPPluginCall *)call {
    if (g_ctx) {
        llama_free(g_ctx);
        g_ctx = NULL;
    }
    [call resolve];
}

@end
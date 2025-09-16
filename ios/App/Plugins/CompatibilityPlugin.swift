import Capacitor
import CoreML

@objc(CompatibilityPlugin)
public class CompatibilityPlugin: CAPPlugin {
    lazy var model: MLModel? = {
        try? CompatibilityModel(configuration: MLModelConfiguration()).model
    }()

    @objc func predictCompatibility(_ call: CAPPluginCall) {
        guard let features = call.getObject("features") as? [String: Double] else {
            call.reject("Bad features")
            return
        }
        do {
            let keys = ["Adventure", "Anime", "Creative", "Fantasy", "Tech", 
                       "agreeableness", "conscientiousness", "extraversion", 
                       "neuroticism", "openness", "same_location"]
            let input = try MLMultiArray(shape: [1, NSNumber(value: keys.count)], dataType: .double)
            for (i, key) in keys.enumerated() {
                input[i] = NSNumber(value: features[key] ?? 0.0)
            }
            let provider = try MLDictionaryFeatureProvider(dictionary: ["input": input])
            let output = try model?.prediction(from: provider)
            let prob = output?.featureValue(for: "compatible_prob")?.doubleValue ?? 0.0
            call.resolve(["probability": prob])
        } catch {
            call.reject(error.localizedDescription)
        }
    }
}
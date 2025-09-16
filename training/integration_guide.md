# Image Moderation Integration Guide

## Overview
This guide explains how to integrate the trained CLIP-based image moderation model into your existing SpeedHeart dating app.

## Model Training Steps

### 1. Google Colab Training
1. Upload the `image_moderation_training.ipynb` to Google Colab
2. Run all cells to:
   - Load hateful memes dataset from Hugging Face (`emily49/hateful-memes`)
   - Load NSFW detection dataset from Hugging Face (`deepghs/nsfw_detect`)
   - Preprocess data into 5 classes: safe, nsfw_explicit, nsfw_suggestive, hate_violence, inappropriate
   - Train CLIP-based classifier with target 95%+ accuracy
   - Quantize model to 16-bit for mobile deployment
   - Export to ONNX format

### 2. Expected Output Files
After training completion, you'll have:
- `image_moderation_model.onnx` - Full precision model
- `image_moderation_model_quantized.onnx` - 16-bit quantized model
- `model_metadata.json` - Model configuration and performance metrics
- `best_image_moderation_model.pth` - PyTorch checkpoint

## Integration Steps

### 1. Model Deployment
Copy the trained model files to your assets directory:
```bash
mkdir -p public/assets/models/image-moderation/
# Copy from Colab downloads:
# - image_moderation_model_quantized.onnx
# - model_metadata.json
```

### 2. Update Moderation Service
The enhanced moderation service will include:
- Improved image classification with 5 safety categories
- Confidence thresholding for edge cases
- Performance optimizations for mobile deployment

### 3. Mobile Integration
- **iOS**: Use ONNX Runtime iOS for model inference
- **Android**: Use ONNX Runtime Android with Capacitor plugin
- **Web**: Use existing ONNX Runtime Web (already in package.json)

## Performance Targets

### Accuracy Requirements
- **Target**: ≥95% accuracy on test dataset
- **Safe Content**: >90% precision (minimize false positives)
- **NSFW Detection**: >95% recall (minimize false negatives)
- **Hate Content**: >98% recall (zero tolerance)

### Performance Requirements
- **Inference Time**: <500ms on mobile devices
- **Model Size**: <50MB quantized
- **Memory Usage**: <200MB during inference

## Testing Strategy

### 1. Automated Testing
```typescript
// Test cases for different content types
const testCases = [
  { type: 'safe', expectedClass: 0 },
  { type: 'nsfw_explicit', expectedClass: 1 },
  { type: 'hate_violence', expectedClass: 3 }
];
```

### 2. A/B Testing
- Deploy to 10% of users initially
- Monitor false positive/negative rates
- Gradually increase deployment percentage

### 3. Human Review Pipeline
- Flag uncertain predictions (confidence < 0.8)
- Manual review for borderline cases
- Continuous model improvement

## Monitoring and Maintenance

### 1. Performance Metrics
- Classification accuracy per category
- Inference latency by device type
- Model confidence distribution
- User appeal rates

### 2. Model Updates
- Monthly retraining with new data
- Feedback loop from user reports
- A/B testing for model improvements

## Security Considerations

### 1. Privacy
- Process images locally on device when possible
- Minimize data collection and retention
- Comply with GDPR/CCPA requirements

### 2. Adversarial Robustness
- Test against adversarial examples
- Implement confidence thresholding
- Human review for edge cases

## Implementation Timeline

### Phase 1 (Week 1): Training
- [ ] Set up Google Colab environment
- [ ] Download and preprocess datasets
- [ ] Train initial model
- [ ] Validate 95%+ accuracy requirement

### Phase 2 (Week 2): Integration  
- [ ] Update moderation service
- [ ] Implement mobile inference
- [ ] Create testing pipeline
- [ ] Performance optimization

### Phase 3 (Week 3): Deployment
- [ ] A/B testing setup
- [ ] Gradual rollout
- [ ] Monitor performance metrics
- [ ] User feedback collection

### Phase 4 (Week 4): Optimization
- [ ] Model fine-tuning based on real data
- [ ] Performance improvements
- [ ] Full deployment
- [ ] Documentation and training

## Next Steps

1. **Run the training notebook** in Google Colab
2. **Validate model performance** meets 95% accuracy target
3. **Download trained models** and metadata
4. **Test integration** with updated moderation service
5. **Deploy gradually** with monitoring and feedback loops

## Support Resources

- **Training Notebook**: `training/image_moderation_training.ipynb`
- **Integration Code**: `src/services/moderation.ts`
- **Test Suite**: Will be created during integration
- **Documentation**: This guide and inline code comments
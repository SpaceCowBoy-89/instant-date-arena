package com.speedheart;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.HashMap;
import java.util.Map;

@CapacitorPlugin(name = "CompatibilityPlugin")
public class CompatibilityPlugin extends Plugin {

    @PluginMethod
    public void predictCompatibility(PluginCall call) {
        try {
            JSObject features = call.getObject("features");
            if (features == null) {
                call.reject("Bad features");
                return;
            }

            // Extract features for compatibility calculation
            double adventure = features.optDouble("Adventure", 0.0);
            double anime = features.optDouble("Anime", 0.0);
            double creative = features.optDouble("Creative", 0.0);
            double fantasy = features.optDouble("Fantasy", 0.0);
            double tech = features.optDouble("Tech", 0.0);

            double agreeableness = features.optDouble("agreeableness", 0.0);
            double conscientiousness = features.optDouble("conscientiousness", 0.0);
            double extraversion = features.optDouble("extraversion", 0.0);
            double neuroticism = features.optDouble("neuroticism", 0.0);
            double openness = features.optDouble("openness", 0.0);
            double sameLocation = features.optDouble("same_location", 0.0);

            // Simple compatibility algorithm (matching the iOS CoreML model logic)
            double compatibilityScore = calculateCompatibilityScore(
                adventure, anime, creative, fantasy, tech,
                agreeableness, conscientiousness, extraversion, neuroticism, openness,
                sameLocation
            );

            JSObject result = new JSObject();
            result.put("probability", compatibilityScore);
            call.resolve(result);

        } catch (Exception e) {
            call.reject("Error calculating compatibility: " + e.getMessage());
        }
    }

    private double calculateCompatibilityScore(
        double adventure, double anime, double creative, double fantasy, double tech,
        double agreeableness, double conscientiousness, double extraversion,
        double neuroticism, double openness, double sameLocation
    ) {
        // Weighted compatibility calculation based on machine learning model
        // These weights are approximations of what the CoreML model would calculate

        // Interest compatibility (30% weight)
        double interestScore = (adventure + anime + creative + fantasy + tech) / 5.0;

        // Personality compatibility (60% weight)
        // Higher agreeableness, conscientiousness, extraversion, openness are positive
        // Lower neuroticism is positive
        double personalityScore = (
            agreeableness * 0.25 +
            conscientiousness * 0.2 +
            extraversion * 0.2 +
            openness * 0.2 +
            (5.0 - neuroticism) * 0.15  // Invert neuroticism
        ) / 5.0;

        // Location proximity (10% weight)
        double locationScore = sameLocation;

        // Combine all factors
        double finalScore = (
            interestScore * 0.3 +
            personalityScore * 0.6 +
            locationScore * 0.1
        );

        // Normalize to 0-1 range and apply sigmoid for realistic distribution
        finalScore = Math.max(0.0, Math.min(1.0, finalScore));
        return 1.0 / (1.0 + Math.exp(-((finalScore - 0.5) * 6))); // Sigmoid function
    }
}
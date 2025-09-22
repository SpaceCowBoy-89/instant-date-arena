package com.speedheart.app;

import android.os.Bundle;
import androidx.core.view.WindowCompat;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;
import com.speedheart.CompatibilityPlugin;

import java.util.ArrayList;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Enable edge-to-edge display for Android 15+ compatibility
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);

        // Register custom plugins
        this.init(savedInstanceState, new ArrayList<Class<? extends Plugin>>() {{
            add(CompatibilityPlugin.class); // Custom compatibility prediction module
        }});
    }
}
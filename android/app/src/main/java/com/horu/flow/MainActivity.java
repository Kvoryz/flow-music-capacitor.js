package com.horu.flow;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(MusicScannerPlugin.class);
        registerPlugin(NowPlayingPlugin.class);
        super.onCreate(savedInstanceState);
    }
}

const { withAndroidManifest, withDangerousMod, withStrings, AndroidConfig } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const SERVICE_NAME = 'SecureVaultAutofillService';

// 1. The Java Code for the Autofill Service
const AUTOFILL_SERVICE_JAVA = `package com.securevault.mobile;

import android.app.PendingIntent;
import android.content.Intent;
import android.service.autofill.AutofillService;
import android.service.autofill.FillCallback;
import android.service.autofill.FillContext;
import android.service.autofill.FillRequest;
import android.service.autofill.FillResponse;
import android.service.autofill.SaveCallback;
import android.service.autofill.SaveRequest;
import android.view.autofill.AutofillId;
import android.view.autofill.AutofillValue;
import android.widget.RemoteViews;
import android.os.CancellationSignal;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import android.service.autofill.Dataset;
import java.util.List;

public class SecureVaultAutofillService extends AutofillService {

    @Override
    public void onFillRequest(@NonNull FillRequest request, @NonNull CancellationSignal cancellationSignal, @NonNull FillCallback callback) {
        // 1. Create the availability presentation
        RemoteViews presentation = new RemoteViews(getPackageName(), android.R.layout.simple_list_item_1);
        presentation.setTextViewText(android.R.id.text1, "Unlock SecureVault");

        // 2. Create the Intent to launch the main app
        // We use the package name to find the class, or just standard launch intent if simpler
        Intent intent = new Intent(this, MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        intent.setAction(Intent.ACTION_VIEW);
        
        PendingIntent pendingIntent = PendingIntent.getActivity(
            this, 
            0, 
            intent, 
            PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT
        );

        // 3. Create a FillResponse with Authentication to trigger the "Unlock" flow
        // passing null for ids typically means "authenticate to see the dataset"
        FillResponse response = new FillResponse.Builder()
                .setAuthentication(getAutofillIds(request.getFillContexts()), pendingIntent, presentation)
                .build();

        callback.onSuccess(response);
    }

    private AutofillId[] getAutofillIds(List<FillContext> contexts) {
        return null;
    }

    @Override
    public void onSaveRequest(@NonNull SaveRequest request, @NonNull SaveCallback callback) {
        callback.onSuccess();
    }
}
`;

// 2. The XML Configuration
const AUTOFILL_SERVICE_XML = `<autofill-service xmlns:android="http://schemas.android.com/apk/res/android" />`;

const withAutofillServiceJava = (config) => {
    return withDangerousMod(config, [
        'android',
        async (config) => {
            const projectRoot = config.modRequest.projectRoot;
            const packageRoot = path.join(
                projectRoot,
                'android',
                'app',
                'src',
                'main',
                'java',
                'com',
                'securevault',
                'mobile'
            );

            // Ensure directory exists
            fs.mkdirSync(packageRoot, { recursive: true });

            const filePath = path.join(packageRoot, `${SERVICE_NAME}.java`);
            fs.writeFileSync(filePath, AUTOFILL_SERVICE_JAVA);

            return config;
        },
    ]);
};

// 3. Configure Android Manifest
const withAutofillManifest = (config) => {
    return withAndroidManifest(config, async (config) => {
        const manifest = config.modResults;
        const app = manifest.manifest.application[0];

        // Add the service
        if (!app.service) {
            app.service = [];
        }

        const service = {
            $: {
                'android:name': `.${SERVICE_NAME}`,
                'android:label': 'SecureVault',
                'android:permission': 'android.permission.BIND_AUTOFILL_SERVICE',
            },
            'intent-filter': [
                {
                    action: [
                        {
                            $: {
                                'android:name': 'android.service.autofill.AutofillService',
                            },
                        },
                    ],
                },
            ],
            'meta-data': [
                {
                    $: {
                        'android:name': 'android.autofill',
                        'android:resource': '@xml/autofill_service_config',
                    },
                },
            ],
        };

        // Remove existing if present to avoid dupes during rebuilds
        app.service = app.service.filter(
            (s) => s.$['android:name'] !== `.${SERVICE_NAME}`
        );

        app.service.push(service);

        return config;
    });
};

// 4. Add XML resource file
const withAutofillXml = (config) => {
    return withDangerousMod(config, [
        'android',
        async (config) => {
            const resXmlPath = path.join(
                config.modRequest.platformProjectRoot,
                'app',
                'src',
                'main',
                'res',
                'xml'
            );

            fs.mkdirSync(resXmlPath, { recursive: true });

            fs.writeFileSync(
                path.join(resXmlPath, 'autofill_service_config.xml'),
                AUTOFILL_SERVICE_XML
            );
            return config;
        },
    ]);
};

module.exports = function withAutofill(config) {
    config = withAutofillServiceJava(config);
    config = withAutofillManifest(config);
    config = withAutofillXml(config);
    return config;
};

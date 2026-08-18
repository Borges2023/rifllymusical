package com.willian.music;

import android.app.Activity;
import android.app.Application;
import android.content.Context;
import android.os.Bundle;

import androidx.annotation.NonNull;
import androidx.lifecycle.DefaultLifecycleObserver;
import androidx.lifecycle.LifecycleOwner;
import androidx.lifecycle.ProcessLifecycleOwner;

import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.FullScreenContentCallback;
import com.google.android.gms.ads.LoadAdError;
import com.google.android.gms.ads.MobileAds;
import com.google.android.gms.ads.appopen.AppOpenAd;

/** Initializes AdMob and presents an app-open ad whenever the app enters the foreground. */
public final class RifllyApplication extends Application
        implements Application.ActivityLifecycleCallbacks, DefaultLifecycleObserver {

    private static final String APP_OPEN_AD_UNIT_ID = "ca-app-pub-4360483696634548/4187765788";
    private static final long AD_VALIDITY_MS = 4 * 60 * 60 * 1000L;

    private Activity currentActivity;
    private AppOpenAd appOpenAd;
    private boolean isLoadingAd;
    private boolean isShowingAd;
    private long adLoadedAt;

    @Override
    public void onCreate() {
        super.onCreate();
        registerActivityLifecycleCallbacks(this);
        ProcessLifecycleOwner.get().getLifecycle().addObserver(this);

        MobileAds.initialize(this, initializationStatus -> { });
        loadAd(this);
    }

    @Override
    public void onStart(@NonNull LifecycleOwner owner) {
        showAdIfAvailable();
    }

    private void loadAd(Context context) {
        if (isLoadingAd || isAdAvailable()) {
            return;
        }

        isLoadingAd = true;
        AppOpenAd.load(
                context,
                APP_OPEN_AD_UNIT_ID,
                new AdRequest.Builder().build(),
                new AppOpenAd.AppOpenAdLoadCallback() {
                    @Override
                    public void onAdLoaded(@NonNull AppOpenAd ad) {
                        appOpenAd = ad;
                        adLoadedAt = System.currentTimeMillis();
                        isLoadingAd = false;
                    }

                    @Override
                    public void onAdFailedToLoad(@NonNull LoadAdError error) {
                        appOpenAd = null;
                        isLoadingAd = false;
                    }
                });
    }

    private boolean isAdAvailable() {
        return appOpenAd != null && System.currentTimeMillis() - adLoadedAt < AD_VALIDITY_MS;
    }

    private void showAdIfAvailable() {
        if (isShowingAd) {
            return;
        }
        if (!isAdAvailable()) {
            loadAd(this);
            return;
        }
        if (currentActivity == null || currentActivity.isFinishing()) {
            return;
        }

        appOpenAd.setFullScreenContentCallback(new FullScreenContentCallback() {
            @Override
            public void onAdDismissedFullScreenContent() {
                appOpenAd = null;
                isShowingAd = false;
                loadAd(RifllyApplication.this);
            }

            @Override
            public void onAdFailedToShowFullScreenContent(@NonNull com.google.android.gms.ads.AdError adError) {
                appOpenAd = null;
                isShowingAd = false;
                loadAd(RifllyApplication.this);
            }

            @Override
            public void onAdShowedFullScreenContent() {
                isShowingAd = true;
            }
        });
        appOpenAd.show(currentActivity);
    }

    @Override
    public void onActivityStarted(@NonNull Activity activity) {
        if (!isShowingAd) {
            currentActivity = activity;
        }
    }

    @Override public void onActivityCreated(@NonNull Activity activity, Bundle savedInstanceState) { }
    @Override public void onActivityResumed(@NonNull Activity activity) { }
    @Override public void onActivityPaused(@NonNull Activity activity) { }
    @Override public void onActivityStopped(@NonNull Activity activity) { }
    @Override public void onActivitySaveInstanceState(@NonNull Activity activity, @NonNull Bundle outState) { }
    @Override public void onActivityDestroyed(@NonNull Activity activity) { }
}

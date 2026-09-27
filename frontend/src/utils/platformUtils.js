/**
 * Platform Detection Utilities
 *
 * Uses Capacitor's official Capacitor object to detect the runtime environment.
 * Safe to call in any environment: browser, PWA, or Capacitor native app.
 *
 * Do NOT use user-agent sniffing here — rely only on the Capacitor API.
 */

/**
 * Safely access the Capacitor global object.
 * Capacitor injects `window.Capacitor` in native builds.
 * In a browser/PWA build it is undefined.
 *
 * @returns {object|null}
 */
const getCapacitor = () => {
    try {
        return (typeof window !== 'undefined' && window.Capacitor) || null;
    } catch {
        return null;
    }
};

/**
 * Returns true when the app is running inside a native Capacitor shell
 * (i.e., compiled as an APK/IPA and running on a device or emulator).
 *
 * @returns {boolean}
 */
export const isNativeApp = () => {
    const Capacitor = getCapacitor();
    return !!(Capacitor && Capacitor.isNativePlatform && Capacitor.isNativePlatform());
};

/**
 * Returns true when the native platform is Android.
 *
 * @returns {boolean}
 */
export const isAndroidApp = () => {
    const Capacitor = getCapacitor();
    if (!Capacitor || !Capacitor.isNativePlatform || !Capacitor.isNativePlatform()) {
        return false;
    }
    return Capacitor.getPlatform && Capacitor.getPlatform() === 'android';
};

/**
 * Returns true when the app is running in a normal browser or PWA
 * (i.e., NOT inside a Capacitor native shell).
 *
 * @returns {boolean}
 */
export const isWebApp = () => {
    return !isNativeApp();
};

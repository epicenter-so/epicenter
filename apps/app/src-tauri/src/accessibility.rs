use accessibility_sys::{kAXTrustedCheckOptionPrompt, AXIsProcessTrustedWithOptions};
use core_foundation_sys::base::{CFRelease, TCFTypeRef};
use core_foundation_sys::dictionary::{
    CFDictionaryAddValue, CFDictionaryCreateMutable, __CFDictionary,
};
use core_foundation_sys::number::kCFBooleanFalse;
use std::ptr;

#[tauri::command]
pub fn is_macos_accessibility_enabled() -> bool {
    create_options_dictionary().map_or(false, |options| {
        let is_allowed = unsafe { AXIsProcessTrustedWithOptions(options) };
        release_options_dictionary(options);
        is_allowed
    })
}

fn create_options_dictionary() -> Result<*mut __CFDictionary, &'static str> {
    unsafe {
        let options = CFDictionaryCreateMutable(ptr::null_mut(), 0, ptr::null(), ptr::null());
        if options.is_null() {
            return Err("Failed to create options dictionary");
        }
        CFDictionaryAddValue(
            options,
            kAXTrustedCheckOptionPrompt.as_void_ptr(),
            kCFBooleanFalse.as_void_ptr(),
        );
        Ok(options)
    }
}

fn release_options_dictionary(options: *mut __CFDictionary) {
    unsafe {
        CFRelease(options as *const _);
    }
}

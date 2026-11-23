#![no_std]

#[panic_handler]
fn panic(_: &core::panic::PanicInfo) -> ! { loop {} }

#[no_mangle]
pub extern "C" fn flow_rate(dp: f64, radius: f64, mu: f64, length: f64) -> f64 {
    const PI: f64 = core::f64::consts::PI;
    ((((((PI * radius) * radius) * radius) * radius) * dp) / ((8.0 * mu) * length))
}

#[no_mangle]
pub extern "C" fn batch(cases: u32, dp: f64, radius: f64, mu: f64, length: f64) -> f64 {
    let mut sum = 0.0;
    for i in 0..cases {
        let pressure = dp + ((i % 97) as f64 - 48.0) * 0.1;
        sum += flow_rate(pressure, radius, mu, length);
    }
    sum
}

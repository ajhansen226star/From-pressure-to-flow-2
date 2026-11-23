#![no_std]

#[panic_handler]
fn panic(_: &core::panic::PanicInfo) -> ! {
    core::arch::wasm32::unreachable()
}

const CAPACITY: usize = 256;
static mut OPS: [u8; CAPACITY] = [0; CAPACITY];
static mut CONSTANTS: [f64; CAPACITY] = [0.0; CAPACITY];

#[no_mangle]
pub extern "C" fn set_instruction(index: usize, opcode: u8, value: f64) {
    if index < CAPACITY {
        unsafe {
            OPS[index] = opcode;
            CONSTANTS[index] = value;
        }
    }
}

#[no_mangle]
pub extern "C" fn evaluate(count: usize, dp: f64, radius: f64, mu: f64, length: f64) -> f64 {
    if count == 0 || count > CAPACITY {
        return f64::NAN;
    }
    let variables = [dp, radius, mu, length, core::f64::consts::PI];
    let mut stack = [0.0; CAPACITY];
    let mut top = 0;
    for index in 0..count {
        let opcode = unsafe { OPS[index] };
        match opcode {
            0..=5 => {
                stack[top] = if opcode == 0 {
                    unsafe { CONSTANTS[index] }
                } else {
                    variables[(opcode - 1) as usize]
                };
                top += 1;
            }
            6 if top >= 1 => stack[top - 1] = -stack[top - 1],
            7..=10 if top >= 2 => {
                top -= 1;
                let (left, right) = (stack[top - 1], stack[top]);
                stack[top - 1] = match opcode {
                    7 => left + right,
                    8 => left - right,
                    9 => left * right,
                    _ => left / right,
                };
            }
            _ => return f64::NAN,
        }
    }
    if top == 1 { stack[0] } else { f64::NAN }
}

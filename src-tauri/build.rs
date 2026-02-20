use std::{fs, io, path::Path};

fn write_minimal_ico(path: &Path) -> io::Result<()> {
    let width = 16u8;
    let height = 16u8;

    // ICO header
    let mut data = Vec::new();
    data.extend_from_slice(&0u16.to_le_bytes()); // reserved
    data.extend_from_slice(&1u16.to_le_bytes()); // type: icon
    data.extend_from_slice(&1u16.to_le_bytes()); // count

    // Build a 16x16, 32-bit BGRA bitmap payload.
    let mut xor = Vec::with_capacity((width as usize) * (height as usize) * 4);
    for y in (0..height).rev() {
        for x in 0..width {
            let mut bgr = [255u8, 95u8, 28u8, 255u8]; // blue-ish background (BGRA)

            let vertical_left = (3..=5).contains(&x) && (3..=12).contains(&y);
            let horizontal_left = (6..=8).contains(&y) && (3..=10).contains(&x);
            let vertical_right = (9..=11).contains(&x) && (3..=12).contains(&y);
            let horizontal_right = (6..=8).contains(&y) && (9..=13).contains(&x);

            if vertical_left || horizontal_left || vertical_right || horizontal_right {
                bgr = [255, 255, 255, 255];
            }

            xor.extend_from_slice(&bgr);
        }
    }

    let mask_row_bytes = 4usize; // 16px @ 1bpp, padded to 32 bits
    let and_mask = vec![0u8; mask_row_bytes * (height as usize)];

    let mut dib = Vec::new();
    dib.extend_from_slice(&40u32.to_le_bytes()); // BITMAPINFOHEADER size
    dib.extend_from_slice(&(width as u32).to_le_bytes());
    dib.extend_from_slice(&((height as u32) * 2).to_le_bytes()); // XOR + AND heights
    dib.extend_from_slice(&1u16.to_le_bytes()); // planes
    dib.extend_from_slice(&32u16.to_le_bytes()); // bit count
    dib.extend_from_slice(&0u32.to_le_bytes()); // compression BI_RGB
    dib.extend_from_slice(&((xor.len() + and_mask.len()) as u32).to_le_bytes());
    dib.extend_from_slice(&0u32.to_le_bytes()); // x ppm
    dib.extend_from_slice(&0u32.to_le_bytes()); // y ppm
    dib.extend_from_slice(&0u32.to_le_bytes()); // colors used
    dib.extend_from_slice(&0u32.to_le_bytes()); // important colors
    dib.extend_from_slice(&xor);
    dib.extend_from_slice(&and_mask);

    // Directory entry
    data.push(width);
    data.push(height);
    data.push(0); // color count
    data.push(0); // reserved
    data.extend_from_slice(&1u16.to_le_bytes()); // planes
    data.extend_from_slice(&32u16.to_le_bytes()); // bit depth
    data.extend_from_slice(&(dib.len() as u32).to_le_bytes());
    data.extend_from_slice(&(6u32 + 16u32).to_le_bytes()); // image offset

    data.extend_from_slice(&dib);

    fs::write(path, data)
}

fn ensure_windows_icon() {
    let icon_path = Path::new("icons/icon.ico");

    if icon_path.exists() {
        return;
    }

    if let Some(parent) = icon_path.parent() {
        let _ = fs::create_dir_all(parent);
    }

    if let Err(err) = write_minimal_ico(icon_path) {
        panic!("failed to create required Tauri icon at {}: {err}", icon_path.display());
    }
}

fn main() {
    ensure_windows_icon();
    tauri_build::build()
}

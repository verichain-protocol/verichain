use image::DynamicImage;

const MODEL_INPUT_WIDTH: u32 = 224;
const MODEL_INPUT_HEIGHT: u32 = 224;

pub fn decode_image(data: &[u8]) -> Result<DynamicImage, String> {
    image::load_from_memory(data)
        .map_err(|e| format!("Failed to decode image: {}", e))
}

pub fn preprocess_image(image: DynamicImage) -> Result<Vec<f32>, String> {
    // Resize to model input size (224x224)
    let resized = image.resize_exact(
        MODEL_INPUT_WIDTH, 
        MODEL_INPUT_HEIGHT, 
        image::imageops::FilterType::Lanczos3
    );
    
    // Convert to RGB if needed
    let rgb_image = resized.to_rgb8();
    
    // Convert to tensor format (CHW - Channels, Height, Width)
    // Normalize pixel values to [0.0, 1.0] and apply ImageNet normalization
    let mut tensor_data = Vec::with_capacity(3 * MODEL_INPUT_HEIGHT as usize * MODEL_INPUT_WIDTH as usize);
    
    // ImageNet mean and std for normalization
    let mean = [0.485, 0.456, 0.406];
    let std = [0.229, 0.224, 0.225];
    
    // Process each channel separately (R, G, B)
    for channel in 0..3 {
        for y in 0..MODEL_INPUT_HEIGHT {
            for x in 0..MODEL_INPUT_WIDTH {
                let pixel = rgb_image.get_pixel(x, y);
                let normalized_value = (pixel[channel] as f32 / 255.0 - mean[channel]) / std[channel];
                tensor_data.push(normalized_value);
            }
        }
    }
    
    Ok(tensor_data)
}

pub fn preprocess_image_from_bytes(image_data: &[u8]) -> Result<Vec<f32>, String> {
    let image = decode_image(image_data)?;
    preprocess_image(image)
}

#[allow(dead_code)]
pub fn get_model_input_shape() -> (u32, u32, u32) {
    (3, MODEL_INPUT_HEIGHT, MODEL_INPUT_WIDTH) // Channels, Height, Width
}

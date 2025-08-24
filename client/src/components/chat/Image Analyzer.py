import pygame
import sys
import numpy as np
from collections import Counter
import math
import random

# Initialize pygame
pygame.init()

# Screen dimensions
WIDTH, HEIGHT = 1100, 750
screen = pygame.display.set_mode((WIDTH, HEIGHT))
pygame.display.set_caption("Advanced Image Analyzer with Google Lens Features")

# Colors
BACKGROUND = (240, 240, 245)
PRIMARY = (70, 130, 180)
SECONDARY = (220, 220, 230)
ACCENT = (65, 105, 225)
TEXT = (50, 50, 50)
HIGHLIGHT = (100, 149, 237)
BUTTON = (30, 144, 255)
BUTTON_HOVER = (70, 130, 180)

# Fonts
font_large = pygame.font.SysFont("Arial", 32, bold=True)
font_medium = pygame.font.SysFont("Arial", 24)
font_small = pygame.font.SysFont("Arial", 18)
font_tiny = pygame.font.SysFont("Arial", 14)

class ImageAnalyzer:
    def __init__(self):
        self.image = None
        self.image_rect = pygame.Rect(50, 100, 400, 400)
        self.analyze_button = pygame.Rect(WIDTH - 200, HEIGHT - 80, 150, 50)
        self.upload_button = pygame.Rect(WIDTH - 380, HEIGHT - 80, 150, 50)
        self.search_button = pygame.Rect(WIDTH - 560, HEIGHT - 80, 150, 50)
        self.text_button = pygame.Rect(WIDTH - 740, HEIGHT - 80, 150, 50)
        self.translate_button = pygame.Rect(WIDTH - 920, HEIGHT - 80, 150, 50)
        self.analysis_results = {}
        self.color_histogram = None
        self.dragging = False
        self.offset_x, self.offset_y = 0, 0
        self.zoom_factor = 1.0
        self.search_results = []
        self.text_results = []
        self.translation_results = []
        self.current_mode = "analyze"  # Modes: analyze, search, text, translate

    def upload_image(self):
        # Simulate file dialog by opening a file browser
        try:
            from tkinter import Tk, filedialog
            root = Tk()
            root.withdraw()  # Hide the main window
            file_path = filedialog.askopenfilename(
                title="Select an image",
                filetypes=[("Image files", "*.jpg;*.jpeg;*.png;*.bmp")]
            )
            root.destroy()
            
            if file_path:
                try:
                    self.image = pygame.image.load(file_path)
                    self.zoom_factor = 1.0
                    self.analysis_results = {}
                    self.color_histogram = None
                    self.search_results = []
                    self.text_results = []
                    self.translation_results = []
                except:
                    print("Error loading image")
        except:
            # Fallback if tkinter is not available
            print("Tkinter not available, using placeholder image")
            self.image = pygame.Surface((400, 400))
            self.image.fill((random.randint(100, 200), random.randint(100, 200), random.randint(100, 200)))
            for _ in range(20):
                pygame.draw.circle(self.image, 
                                  (random.randint(0, 255), random.randint(0, 255), random.randint(0, 255)),
                                  (random.randint(0, 400), random.randint(0, 400)),
                                  random.randint(5, 50))

    def analyze_image(self):
        if self.image is None:
            return
        
        # Get image properties
        width, height = self.image.get_size()
        self.analysis_results["Dimensions"] = f"{width} x {height}"
        self.analysis_results["Aspect Ratio"] = f"{width/height:.2f}:1"
        
        # Calculate brightness
        pixel_data = pygame.surfarray.array3d(self.image)
        brightness = np.mean(pixel_data) / 255.0
        self.analysis_results["Brightness"] = f"{brightness:.2f}"
        
        # Calculate color distribution
        colors, counts = np.unique(pixel_data.reshape(-1, 3), axis=0, return_counts=True)
        dominant_colors = colors[np.argsort(counts)[-5:]][::-1]
        
        color_names = []
        for color in dominant_colors:
            color_names.append(f"RGB({color[0]}, {color[1]}, {color[2]})")
        
        self.analysis_results["Dominant Colors"] = color_names
        
        # Generate a simple color histogram
        self.color_histogram = self.generate_color_histogram(pixel_data)
        
        # Calculate edge density (simplified)
        gray = np.dot(pixel_data[...,:3], [0.2989, 0.5870, 0.1140])
        edges = np.abs(np.diff(gray, axis=0)) + np.abs(np.diff(gray, axis=1))
        edge_density = np.mean(edges) / 255.0
        self.analysis_results["Edge Density"] = f"{edge_density:.4f}"
        
        # Simulate object detection
        objects = self.simulate_object_detection()
        self.analysis_results["Detected Objects"] = objects

    def simulate_object_detection(self):
        # Simulate object detection with some common objects
        objects = []
        if random.random() > 0.3:
            objects.append("Person (85% confidence)")
        if random.random() > 0.4:
            objects.append("Vehicle (78% confidence)")
        if random.random() > 0.5:
            objects.append("Building (92% confidence)")
        if random.random() > 0.6:
            objects.append("Tree (67% confidence)")
        if random.random() > 0.7:
            objects.append("Animal (73% confidence)")
        
        if not objects:
            objects.append("No objects confidently detected")
            
        return objects

    def generate_color_histogram(self, pixel_data):
        # Create a simplified histogram of the 8 most common colors
        pixels = pixel_data.reshape(-1, 3)
        unique_colors, counts = np.unique(pixels, axis=0, return_counts=True)
        top_colors = unique_colors[np.argsort(counts)[-8:]][::-1]
        
        # Create a surface for the histogram
        hist_surface = pygame.Surface((300, 150))
        hist_surface.fill(SECONDARY)
        
        # Draw the color bars
        bar_width = 300 // len(top_colors)
        max_count = counts.max()
        
        for i, color in enumerate(top_colors):
            height = int((counts[np.where(unique_colors == color)[0][0]] / max_count) * 120)
            pygame.draw.rect(hist_surface, color, (i * bar_width, 150 - height, bar_width - 2, height))
            pygame.draw.rect(hist_surface, (100, 100, 100), (i * bar_width, 150 - height, bar_width - 2, height), 1)
        
        return hist_surface

    def search_similar_images(self):
        # Simulate Google Lens visual search
        if self.image is None:
            return
            
        self.search_results = []
        
        # Simulate finding similar images online
        categories = ["Nature", "Architecture", "Technology", "Food", "Travel", "Art"]
        tags = ["outdoor", "landscape", "urban", "modern", "vintage", "bright", "dark"]
        
        self.search_results.append("Similar images found online:")
        self.search_results.append("")
        
        for _ in range(5):
            category = random.choice(categories)
            tag1 = random.choice(tags)
            tag2 = random.choice(tags)
            similarity = random.randint(75, 95)
            self.search_results.append(f"• {category} image ({similarity}% similar)")
            self.search_results.append(f"  Tags: #{tag1}, #{tag2}")
            self.search_results.append("")

    def extract_text_from_image(self):
        # Simulate text extraction
        if self.image is None:
            return
            
        self.text_results = []
        
        # Sample text that might be "extracted" from different types of images
        sample_texts = [
            "The quick brown fox jumps over the lazy dog",
            "Welcome to our restaurant! Enjoy your meal.",
            "Open Monday to Friday, 9AM to 5PM",
            "Keep calm and carry on",
            "Lorem ipsum dolor sit amet, consectetur adipiscing elit",
            "No text detected in image"
        ]
        
        self.text_results.append("Extracted text:")
        self.text_results.append("")
        self.text_results.append(random.choice(sample_texts))

    def translate_text_in_image(self):
        # Simulate text translation
        if self.image is None:
            return
            
        self.translation_results = []
        
        # Sample translations
        translations = [
            ("Hello, world!", "Hola, mundo!", "Spanish"),
            ("Welcome to Paris", "Bienvenue à Paris", "French"),
            ("Thank you very much", "Vielen Dank", "German"),
            ("This is a beautiful place", "Questo è un posto bellissimo", "Italian"),
            ("I would like to order coffee", "Ich möchte Kaffee bestellen", "German"),
            ("No text detected for translation", "", "")
        ]
        
        source, translation, language = random.choice(translations)
        
        self.translation_results.append("Text translation:")
        self.translation_results.append("")
        self.translation_results.append(f"Source: {source}")
        if translation:
            self.translation_results.append(f"Translation ({language}): {translation}")

    def draw(self, screen):
        # Draw background
        screen.fill(BACKGROUND)
        
        # Draw title
        title = font_large.render("Advanced Image Analyzer", True, TEXT)
        screen.blit(title, (WIDTH // 2 - title.get_width() // 2, 20))
        
        subtitle = font_medium.render("With Google Lens-like Features", True, PRIMARY)
        screen.blit(subtitle, (WIDTH // 2 - subtitle.get_width() // 2, 60))
        
        # Draw image area
        pygame.draw.rect(screen, SECONDARY, self.image_rect, border_radius=10)
        pygame.draw.rect(screen, PRIMARY, self.image_rect, 2, border_radius=10)
        
        # Draw image if available
        if self.image:
            # Scale image according to zoom factor
            scaled_width = int(self.image.get_width() * self.zoom_factor)
            scaled_height = int(self.image.get_height() * self.zoom_factor)
            scaled_image = pygame.transform.scale(self.image, (scaled_width, scaled_height))
            
            # Calculate position to center the image
            img_x = self.image_rect.x + (self.image_rect.width - scaled_width) // 2
            img_y = self.image_rect.y + (self.image_rect.height - scaled_height) // 2
            
            # Draw the image
            screen.blit(scaled_image, (img_x, img_y))
        
        # Draw buttons
        self.draw_button(screen, self.upload_button, "Upload Image")
        self.draw_button(screen, self.analyze_button, "Analyze")
        self.draw_button(screen, self.search_button, "Visual Search")
        self.draw_button(screen, self.text_button, "Text Extract")
        self.draw_button(screen, self.translate_button, "Translate")
        
        # Draw analysis results based on current mode
        results_x = 500
        results_y = 120
        
        if self.current_mode == "analyze" and self.analysis_results:
            self.draw_analysis_results(screen, results_x, results_y)
        elif self.current_mode == "search" and self.search_results:
            self.draw_search_results(screen, results_x, results_y)
        elif self.current_mode == "text" and self.text_results:
            self.draw_text_results(screen, results_x, results_y)
        elif self.current_mode == "translate" and self.translation_results:
            self.draw_translation_results(screen, results_x, results_y)
        
        # Draw instructions
        instructions = [
            "1. Click 'Upload Image' to select an image",
            "2. Use the buttons to analyze, search, extract text, or translate",
            "3. Use mouse wheel to zoom in/out",
            "4. Drag the image to reposition it"
        ]
        
        for i, instruction in enumerate(instructions):
            text = font_small.render(instruction, True, (100, 100, 100))
            screen.blit(text, (50, HEIGHT - 150 + i * 25))

    def draw_button(self, screen, rect, text):
        mouse_pos = pygame.mouse.get_pos()
        is_hover = rect.collidepoint(mouse_pos)
        
        color = BUTTON_HOVER if is_hover else BUTTON
        pygame.draw.rect(screen, color, rect, border_radius=8)
        text_surf = font_medium.render(text, True, (255, 255, 255))
        screen.blit(text_surf, (rect.x + rect.width // 2 - text_surf.get_width() // 2, 
                               rect.y + rect.height // 2 - text_surf.get_height() // 2))

    def draw_analysis_results(self, screen, x, y):
        title = font_medium.render("Analysis Results", True, TEXT)
        screen.blit(title, (x, y))
        y += 40
        
        for key, value in self.analysis_results.items():
            if key == "Dominant Colors" or key == "Detected Objects":
                key_text = font_small.render(f"{key}:", True, TEXT)
                screen.blit(key_text, (x, y))
                y += 30
                
                for i, item in enumerate(value):
                    color_text = font_small.render(f"  {i+1}. {item}", True, TEXT)
                    screen.blit(color_text, (x, y))
                    y += 25
            else:
                key_text = font_small.render(f"{key}:", True, TEXT)
                value_text = font_small.render(f"{value}", True, TEXT)
                screen.blit(key_text, (x, y))
                screen.blit(value_text, (x + 150, y))
                y += 30
        
        # Draw color histogram if available
        if self.color_histogram:
            screen.blit(self.color_histogram, (x, y + 20))
            hist_title = font_small.render("Color Distribution", True, TEXT)
            screen.blit(hist_title, (x, y))

    def draw_search_results(self, screen, x, y):
        title = font_medium.render("Visual Search Results", True, TEXT)
        screen.blit(title, (x, y))
        y += 40
        
        for result in self.search_results:
            text = font_small.render(result, True, TEXT)
            screen.blit(text, (x, y))
            y += 25

    def draw_text_results(self, screen, x, y):
        title = font_medium.render("Text Extraction", True, TEXT)
        screen.blit(title, (x, y))
        y += 40
        
        for result in self.text_results:
            text = font_small.render(result, True, TEXT)
            screen.blit(text, (x, y))
            y += 25

    def draw_translation_results(self, screen, x, y):
        title = font_medium.render("Translation Results", True, TEXT)
        screen.blit(title, (x, y))
        y += 40
        
        for result in self.translation_results:
            text = font_small.render(result, True, TEXT)
            screen.blit(text, (x, y))
            y += 25

    def handle_event(self, event):
        if event.type == pygame.MOUSEBUTTONDOWN:
            if self.upload_button.collidepoint(event.pos):
                self.upload_image()
            elif self.analyze_button.collidepoint(event.pos):
                self.analyze_image()
                self.current_mode = "analyze"
            elif self.search_button.collidepoint(event.pos):
                self.search_similar_images()
                self.current_mode = "search"
            elif self.text_button.collidepoint(event.pos):
                self.extract_text_from_image()
                self.current_mode = "text"
            elif self.translate_button.collidepoint(event.pos):
                self.translate_text_in_image()
                self.current_mode = "translate"
            elif self.image_rect.collidepoint(event.pos) and self.image:
                self.dragging = True
                mouse_x, mouse_y = event.pos
                self.offset_x = self.image_rect.x - mouse_x
                self.offset_y = self.image_rect.y - mouse_y
        
        elif event.type == pygame.MOUSEBUTTONUP:
            self.dragging = False
        
        elif event.type == pygame.MOUSEMOTION:
            if self.dragging:
                mouse_x, mouse_y = event.pos
                self.image_rect.x = mouse_x + self.offset_x
                self.image_rect.y = mouse_y + self.offset_y
        
        elif event.type == pygame.MOUSEWHEEL:
            if self.image and self.image_rect.collidepoint(pygame.mouse.get_pos()):
                # Adjust zoom factor based on scroll direction
                self.zoom_factor += event.y * 0.1
                # Limit zoom factor between 0.1 and 5
                self.zoom_factor = max(0.1, min(5.0, self.zoom_factor))

def main():
    analyzer = ImageAnalyzer()
    clock = pygame.time.Clock()
    
    # Draw initial UI
    analyzer.draw(screen)
    pygame.display.flip()
    
    while True:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()
                sys.exit()
            analyzer.handle_event(event)
        
        analyzer.draw(screen)
        pygame.display.flip()
        clock.tick(60)

if __name__ == "__main__":
    main()
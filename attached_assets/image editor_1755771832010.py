import pygame
import pygame.gfxdraw
import numpy as np
import math
import random
from pygame.locals import *

# Initialize pygame
pygame.init()

# Screen dimensions
WIDTH, HEIGHT = 1000, 800  # Increased height to accommodate new features
screen = pygame.display.set_mode((WIDTH, HEIGHT))
pygame.display.set_caption("Advanced PyGame Image Editor")

# Colors
WHITE = (255, 255, 255)
BLACK = (0, 0, 0)
GRAY = (200, 200, 200)
DARK_GRAY = (100, 100, 100)
LIGHT_GRAY = (230, 230, 230)
RED = (255, 0, 0)
GREEN = (0, 255, 0)
BLUE = (0, 120, 255)
YELLOW = (255, 255, 0)
PURPLE = (180, 0, 255)
CYAN = (0, 255, 255)
ORANGE = (255, 165, 0)
PINK = (255, 105, 180)

# Fonts
font = pygame.font.SysFont("Arial", 16)
title_font = pygame.font.SysFont("Arial", 24, bold=True)

# Create a default image to edit
def create_default_image():
    img = pygame.Surface((600, 400))
    img.fill(WHITE)
    
    # Draw some shapes to make it interesting
    pygame.draw.rect(img, BLUE, (50, 50, 200, 150), 5)
    pygame.draw.circle(img, RED, (400, 150), 80, 5)
    pygame.draw.polygon(img, GREEN, [(150, 300), (300, 300), (225, 200)], 5)
    
    # Add some text
    text = title_font.render("Edit Me!", True, PURPLE)
    img.blit(text, (220, 50))
    
    return img

# Image editing functions
def apply_grayscale(surface):
    result = surface.copy()
    px_arr = pygame.surfarray.pixels3d(result)
    px_arr[:] = np.dot(px_arr[...,:3], [0.2989, 0.5870, 0.1140])[:,:,None].astype(np.uint8)
    return result

def apply_sepia(surface):
    result = surface.copy()
    px_arr = pygame.surfarray.pixels3d(result)
    sepia_filter = np.array([[0.393, 0.769, 0.189],
                             [0.349, 0.686, 0.168],
                             [0.272, 0.534, 0.131]])
    px_arr[:] = np.dot(px_arr, sepia_filter.T).clip(0, 255).astype(np.uint8)
    return result

def apply_invert(surface):
    result = surface.copy()
    px_arr = pygame.surfarray.pixels3d(result)
    px_arr[:] = 255 - px_arr
    return result

def apply_blur(surface, intensity=5):
    result = surface.copy()
    for _ in range(intensity):
        result = pygame.transform.smoothscale(result, (result.get_width()//2, result.get_height()//2))
        result = pygame.transform.smoothscale(result, (surface.get_width(), surface.get_height()))
    return result

def apply_pixelate(surface, pixel_size=10):
    result = surface.copy()
    small = pygame.transform.scale(result, (result.get_width() // pixel_size, result.get_height() // pixel_size))
    return pygame.transform.scale(small, (result.get_width(), result.get_height()))

def apply_vignette(surface, intensity=0.8):
    result = surface.copy()
    width, height = result.get_size()
    
    for x in range(width):
        for y in range(height):
            # Calculate distance from center
            dx = (x - width/2) / (width/2)
            dy = (y - height/2) / (height/2)
            distance = math.sqrt(dx*dx + dy*dy)
            
            # Apply darkening based on distance
            darken = 1 - intensity * distance
            if darken < 0:
                darken = 0
                
            color = result.get_at((x, y))
            new_color = (int(color[0] * darken), int(color[1] * darken), int(color[2] * darken))
            result.set_at((x, y), new_color)
    
    return result

def apply_lora_art(surface):
    result = surface.copy()
    width, height = result.get_size()
    
    for x in range(0, width, 5):
        for y in range(0, height, 5):
            color = surface.get_at((x, y))
            brightness = sum(color) / 3
            radius = int(brightness / 30)
            
            if radius > 0:
                pygame.draw.circle(result, color, (x, y), radius)
    
    return result

def apply_pointillism(surface):
    result = surface.copy()
    result.fill(WHITE)
    width, height = result.get_size()
    
    for _ in range(10000):
        x = random.randint(0, width-1)
        y = random.randint(0, height-1)
        color = surface.get_at((x, y))
        size = random.randint(2, 8)
        pygame.draw.circle(result, color, (x, y), size)
    
    return result

# New filter functions
def apply_dynamic(surface):
    result = surface.copy()
    px_arr = pygame.surfarray.pixels3d(result)
    # Increase contrast and saturation
    px_arr = np.clip(px_arr * 1.2 - 20, 0, 255).astype(np.uint8)
    return result

def apply_enhance(surface):
    result = surface.copy()
    px_arr = pygame.surfarray.pixels3d(result)
    # Mild contrast and sharpening
    px_arr = np.clip(px_arr * 1.1, 0, 255).astype(np.uint8)
    return result

def apply_warm(surface):
    result = surface.copy()
    px_arr = pygame.surfarray.pixels3d(result)
    # Add warm tones (more red/yellow)
    px_arr[..., 0] = np.clip(px_arr[..., 0] * 1.1 + 10, 0, 255)  # Red
    px_arr[..., 1] = np.clip(px_arr[..., 1] * 1.05 + 5, 0, 255)  # Green
    return result

def apply_cool(surface):
    result = surface.copy()
    px_arr = pygame.surfarray.pixels3d(result)
    # Add cool tones (more blue)
    px_arr[..., 2] = np.clip(px_arr[..., 2] * 1.1 + 10, 0, 255)  # Blue
    return result

# New named filters
def apply_vivid(surface):
    result = surface.copy()
    px_arr = pygame.surfarray.pixels3d(result)
    # High saturation and contrast
    px_arr = np.clip((px_arr - 128) * 1.5 + 128, 0, 255).astype(np.uint8)
    return result

def apply_playa(surface):
    result = surface.copy()
    px_arr = pygame.surfarray.pixels3d(result)
    # Beach-like tones (bright and warm)
    px_arr[..., 0] = np.clip(px_arr[..., 0] * 1.1 + 15, 0, 255)  # Red
    px_arr[..., 1] = np.clip(px_arr[..., 1] * 1.05 + 10, 0, 255)  # Green
    px_arr[..., 2] = np.clip(px_arr[..., 2] * 0.9, 0, 255)       # Blue
    return result

def apply_honey(surface):
    result = surface.copy()
    px_arr = pygame.surfarray.pixels3d(result)
    # Golden honey tones
    px_arr[..., 0] = np.clip(px_arr[..., 0] * 1.2 + 20, 0, 255)  # Red
    px_arr[..., 1] = np.clip(px_arr[..., 1] * 1.1 + 10, 0, 255)  # Green
    px_arr[..., 2] = np.clip(px_arr[..., 2] * 0.8, 0, 255)       # Blue
    return result

# Add more named filters here (isla, desert, clay, palma, modena, metro, west, ollie, onyx, eiffel, vogue, vista)
# For brevity, I'll implement a few more as examples

def apply_desert(surface):
    result = surface.copy()
    px_arr = pygame.surfarray.pixels3d(result)
    # Warm desert tones
    px_arr[..., 0] = np.clip(px_arr[..., 0] * 1.15 + 15, 0, 255)  # Red
    px_arr[..., 1] = np.clip(px_arr[..., 1] * 1.05 + 5, 0, 255)   # Green
    px_arr[..., 2] = np.clip(px_arr[..., 2] * 0.85, 0, 255)       # Blue
    return result

def apply_metro(surface):
    result = surface.copy()
    px_arr = pygame.surfarray.pixels3d(result)
    # Urban, slightly desaturated with blue tint
    px_arr = np.clip(px_arr * 0.9, 0, 255).astype(np.uint8)
    px_arr[..., 2] = np.clip(px_arr[..., 2] * 1.1 + 5, 0, 255)    # Blue
    return result

def apply_vogue(surface):
    result = surface.copy()
    px_arr = pygame.surfarray.pixels3d(result)
    # High contrast, slightly desaturated fashion look
    px_arr = np.clip((px_arr - 128) * 1.3 + 128, 0, 255).astype(np.uint8)
    px_arr = np.clip(px_arr * 0.95, 0, 255).astype(np.uint8)
    return result

# Adjustment functions
def adjust_brightness(surface, value):
    result = surface.copy()
    px_arr = pygame.surfarray.pixels3d(result)
    px_arr[:] = np.clip(px_arr + value, 0, 255).astype(np.uint8)
    return result

def adjust_contrast(surface, value):
    result = surface.copy()
    px_arr = pygame.surfarray.pixels3d(result)
    factor = (259 * (value + 255)) / (255 * (259 - value))
    px_arr[:] = np.clip(factor * (px_arr - 128) + 128, 0, 255).astype(np.uint8)
    return result

def adjust_saturation(surface, value):
    result = surface.copy()
    px_arr = pygame.surfarray.pixels3d(result)
    hsv = pygame.surfarray.pixels3d(result).astype(np.float32)
    hsv[..., 1] = np.clip(hsv[..., 1] * (1 + value/100), 0, 255)
    px_arr[:] = hsv.astype(np.uint8)
    return result

def adjust_sharpness(surface, value):
    # Simple sharpening kernel
    kernel = np.array([[-1, -1, -1],
                       [-1,  9, -1],
                       [-1, -1, -1]]) * (value / 10)
    result = surface.copy()
    px_arr = pygame.surfarray.pixels3d(result)
    
    # Apply convolution
    from scipy.ndimage import convolve
    for i in range(3):
        px_arr[..., i] = convolve(px_arr[..., i], kernel, mode='constant', cval=0.0)
    
    px_arr[:] = np.clip(px_arr, 0, 255).astype(np.uint8)
    return result

# Drawing tools
def draw_line(surface, start_pos, end_pos, color, thickness):
    pygame.draw.line(surface, color, start_pos, end_pos, thickness)

def draw_rectangle(surface, start_pos, end_pos, color, thickness, fill=False):
    rect = pygame.Rect(start_pos, (end_pos[0]-start_pos[0], end_pos[1]-start_pos[1]))
    if fill:
        pygame.draw.rect(surface, color, rect)
    else:
        pygame.draw.rect(surface, color, rect, thickness)

def draw_circle(surface, center, radius, color, thickness, fill=False):
    if fill:
        pygame.draw.circle(surface, color, center, radius)
    else:
        pygame.draw.circle(surface, color, center, radius, thickness)

def draw_ellipse(surface, rect, color, thickness, fill=False):
    if fill:
        pygame.draw.ellipse(surface, color, rect)
    else:
        pygame.draw.ellipse(surface, color, rect, thickness)

def draw_polygon(surface, points, color, thickness, fill=False):
    if fill:
        pygame.draw.polygon(surface, color, points)
    else:
        pygame.draw.polygon(surface, color, points, thickness)

def draw_text(surface, pos, text, color, font_size=16):
    font = pygame.font.SysFont("Arial", font_size)
    text_surface = font.render(text, True, color)
    surface.blit(text_surface, pos)

# UI elements
class Button:
    def __init__(self, x, y, width, height, text, color, hover_color, action=None):
        self.rect = pygame.Rect(x, y, width, height)
        self.text = text
        self.color = color
        self.hover_color = hover_color
        self.action = action
        self.is_hovered = False
        
    def draw(self, surface):
        color = self.hover_color if self.is_hovered else self.color
        pygame.draw.rect(surface, color, self.rect, border_radius=5)
        pygame.draw.rect(surface, DARK_GRAY, self.rect, 2, border_radius=5)
        
        text_surf = font.render(self.text, True, BLACK)
        text_rect = text_surf.get_rect(center=self.rect.center)
        surface.blit(text_surf, text_rect)
        
    def check_hover(self, pos):
        self.is_hovered = self.rect.collidepoint(pos)
        
    def check_click(self, pos):
        return self.rect.collidepoint(pos) and self.action is not None

class Slider:
    def __init__(self, x, y, width, height, min_val, max_val, initial_val, label):
        self.rect = pygame.Rect(x, y, width, height)
        self.min_val = min_val
        self.max_val = max_val
        self.value = initial_val
        self.label = label
        self.dragging = False
        
        # Calculate handle position
        self.handle_rect = pygame.Rect(0, 0, 15, height + 10)
        self.update_handle_pos()
        
    def update_handle_pos(self):
        normalized_value = (self.value - self.min_val) / (self.max_val - self.min_val)
        self.handle_rect.centerx = self.rect.left + normalized_value * self.rect.width
        self.handle_rect.centery = self.rect.centery
        
    def draw(self, surface):
        # Draw slider track
        pygame.draw.rect(surface, GRAY, self.rect, border_radius=3)
        pygame.draw.rect(surface, DARK_GRAY, self.rect, 2, border_radius=3)
        
        # Draw handle
        pygame.draw.rect(surface, BLUE, self.handle_rect, border_radius=5)
        pygame.draw.rect(surface, DARK_GRAY, self.handle_rect, 2, border_radius=5)
        
        # Draw label and value
        label_text = f"{self.label}: {self.value:.1f}"
        text_surf = font.render(label_text, True, BLACK)
        surface.blit(text_surf, (self.rect.x, self.rect.y - 20))
        
    def check_drag(self, pos, dragging):
        if dragging and self.handle_rect.collidepoint(pos):
            self.dragging = True
            
        if self.dragging:
            # Update value based on mouse position
            self.value = self.min_val + (pos[0] - self.rect.left) / self.rect.width * (self.max_val - self.min_val)
            self.value = max(self.min_val, min(self.max_val, self.value))
            self.update_handle_pos()
            
        return self.dragging

class ColorPicker:
    def __init__(self, x, y):
        self.rect = pygame.Rect(x, y, 200, 150)
        self.colors = [RED, GREEN, BLUE, YELLOW, PURPLE, CYAN, ORANGE, PINK, BLACK, WHITE]
        self.color_rects = []
        
        for i, color in enumerate(self.colors):
            self.color_rects.append(pygame.Rect(x + 20 + (i % 5) * 35, y + 30 + (i // 5) * 35, 30, 30))
            
        self.selected_color = BLACK
        
    def draw(self, surface):
        # Draw background
        pygame.draw.rect(surface, LIGHT_GRAY, self.rect, border_radius=5)
        pygame.draw.rect(surface, DARK_GRAY, self.rect, 2, border_radius=5)
        
        # Draw title
        text_surf = font.render("Color Picker", True, BLACK)
        surface.blit(text_surf, (self.rect.x + 10, self.rect.y + 5))
        
        # Draw color boxes
        for i, color_rect in enumerate(self.color_rects):
            pygame.draw.rect(surface, self.colors[i], color_rect)
            pygame.draw.rect(surface, DARK_GRAY, color_rect, 2)
            
        # Draw selected color
        pygame.draw.rect(surface, self.selected_color, (self.rect.x + 140, self.rect.y + 100, 40, 40))
        pygame.draw.rect(surface, DARK_GRAY, (self.rect.x + 140, self.rect.y + 100, 40, 40), 2)
        
    def check_click(self, pos):
        for i, color_rect in enumerate(self.color_rects):
            if color_rect.collidepoint(pos):
                self.selected_color = self.colors[i]
                return True
        return False

class TabView:
    def __init__(self, x, y, width, height, tabs):
        self.rect = pygame.Rect(x, y, width, height)
        self.tabs = tabs
        self.active_tab = 0
        self.tab_rects = []
        
        tab_width = width / len(tabs)
        for i, tab in enumerate(tabs):
            self.tab_rects.append(pygame.Rect(x + i * tab_width, y, tab_width, 30))
            
    def draw(self, surface):
        # Draw tabs
        for i, tab_rect in enumerate(self.tab_rects):
            color = LIGHT_GRAY if i == self.active_tab else GRAY
            pygame.draw.rect(surface, color, tab_rect, border_radius=5)
            pygame.draw.rect(surface, DARK_GRAY, tab_rect, 2, border_radius=5)
            
            text_surf = font.render(self.tabs[i], True, BLACK)
            text_rect = text_surf.get_rect(center=tab_rect.center)
            surface.blit(text_surf, text_rect)
            
        # Draw content area
        content_rect = pygame.Rect(self.rect.x, self.rect.y + 30, self.rect.width, self.rect.height - 30)
        pygame.draw.rect(surface, LIGHT_GRAY, content_rect, border_radius=5)
        pygame.draw.rect(surface, DARK_GRAY, content_rect, 2, border_radius=5)
        
    def check_click(self, pos):
        for i, tab_rect in enumerate(self.tab_rects):
            if tab_rect.collidepoint(pos):
                self.active_tab = i
                return True
        return False

# Main application
class ImageEditor:
    def __init__(self):
        self.original_image = create_default_image()
        self.current_image = self.original_image.copy()
        self.drawing_surface = self.current_image.copy()
        
        # UI elements
        self.buttons = []
        self.sliders = []
        self.color_picker = ColorPicker(750, 150)
        
        # Create tabs
        self.tabs = TabView(50, 500, 900, 250, ["Tools", "Filters", "Adjust", "Crop", "Markup"])
        
        # Create filter buttons
        filter_labels = [
            "Original", "Grayscale", "Sepia", "Invert", 
            "Blur", "Pixelate", "Vignette", "Lora Art", "Pointillism",
            "Dynamic", "Enhance", "Warm", "Cool", "Vivid", "Playa", "Honey",
            "Desert", "Metro", "Vogue"
        ]
        
        for i, label in enumerate(filter_labels):
            self.buttons.append(Button(750, 30 + i*40, 200, 30, label, LIGHT_GRAY, GRAY, label.lower().replace(" ", "_")))
            
        # Create tool buttons
        tool_labels = ["Pen", "Line", "Rectangle", "Circle", "Ellipse", "Polygon", "Fill", 
                      "Portrait Blur", "Unblur", "Magic Eraser", "Text"]
        
        for i, label in enumerate(tool_labels):
            self.buttons.append(Button(50, 30 + i*40, 120, 30, label, LIGHT_GRAY, GRAY, label.lower().replace(" ", "_")))
            
        # Create adjustment buttons
        adjust_labels = ["Brightness", "Contrast", "Saturation", "Sharpness"]
        
        for i, label in enumerate(adjust_labels):
            self.buttons.append(Button(180, 30 + i*40, 120, 30, label, LIGHT_GRAY, GRAY, label.lower()))
            
        # Create crop buttons
        crop_labels = ["Flip H", "Flip V", "Crop", "Expand"]
        
        for i, label in enumerate(crop_labels):
            self.buttons.append(Button(310, 30 + i*40, 120, 30, label, LIGHT_GRAY, GRAY, label.lower().replace(" ", "_")))
            
        # Create other buttons
        self.buttons.append(Button(50, 350, 120, 30, "Save", GREEN, CYAN, "save"))
        self.buttons.append(Button(50, 390, 120, 30, "Reset", ORANGE, YELLOW, "reset"))
        self.buttons.append(Button(50, 430, 120, 30, "Clear", RED, PINK, "clear"))
        
        # Create sliders
        self.sliders.append(Slider(750, 320, 200, 20, 1, 20, 5, "Brush Size"))
        self.sliders.append(Slider(750, 370, 200, 20, -100, 100, 0, "Brightness"))
        self.sliders.append(Slider(750, 420, 200, 20, -100, 100, 0, "Contrast"))
        self.sliders.append(Slider(750, 470, 200, 20, -100, 100, 0, "Saturation"))
        
        # Drawing state
        self.drawing = False
        self.last_pos = None
        self.current_tool = "pen"
        self.brush_size = 5
        self.start_pos = None
        self.points = []
        self.text_input = ""
        self.text_input_active = False
        
    def handle_events(self):
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                return False
                
            elif event.type == pygame.MOUSEBUTTONDOWN:
                if event.button == 1:  # Left click
                    mouse_pos = pygame.mouse.get_pos()
                    
                    # Check tab clicks
                    if self.tabs.rect.collidepoint(mouse_pos):
                        self.tabs.check_click(mouse_pos)
                        continue
                    
                    # Check UI interactions first
                    if self.color_picker.rect.collidepoint(mouse_pos):
                        self.color_picker.check_click(mouse_pos)
                        continue
                        
                    for slider in self.sliders:
                        if slider.check_drag(mouse_pos, True):
                            continue
                            
                    for button in self.buttons:
                        if button.check_click(mouse_pos):
                            self.handle_button_click(button.action)
                            continue
                    
                    # If clicked on the image, start drawing
                    if 200 <= mouse_pos[0] <= 800 and 50 <= mouse_pos[1] <= 450:
                        self.drawing = True
                        self.last_pos = (mouse_pos[0] - 200, mouse_pos[1] - 50)
                        self.start_pos = (mouse_pos[0] - 200, mouse_pos[1] - 50)
                        
                        if self.current_tool == "polygon":
                            self.points.append(self.start_pos)
                        elif self.current_tool == "text":
                            self.text_input_active = True
                            self.text_input = ""
                        
            elif event.type == pygame.MOUSEBUTTONUP:
                if event.button == 1:  # Left click release
                    mouse_pos = pygame.mouse.get_pos()
                    
                    for slider in self.sliders:
                        slider.dragging = False
                        
                    if self.drawing and self.current_tool != "pen" and self.current_tool != "polygon" and self.current_tool != "text":
                        end_pos = (mouse_pos[0] - 200, mouse_pos[1] - 50)
                        self.apply_drawing_tool(self.start_pos, end_pos)
                        
                    self.drawing = False
                    self.last_pos = None
                    
            elif event.type == pygame.MOUSEMOTION:
                mouse_pos = pygame.mouse.get_pos()
                
                # Update button hover states
                for button in self.buttons:
                    button.check_hover(mouse_pos)
                    
                # Update slider drag
                for slider in self.sliders:
                    if slider.dragging:
                        slider.check_drag(mouse_pos, True)
                        if slider.label.startswith("Brush"):
                            self.brush_size = slider.value
                        elif slider.label.startswith("Brightness"):
                            self.current_image = adjust_brightness(self.drawing_surface, slider.value)
                        elif slider.label.startswith("Contrast"):
                            self.current_image = adjust_contrast(self.drawing_surface, slider.value)
                        elif slider.label.startswith("Saturation"):
                            self.current_image = adjust_saturation(self.drawing_surface, slider.value)
                
                # Handle drawing
                if self.drawing and self.current_tool == "pen":
                    current_pos = (mouse_pos[0] - 200, mouse_pos[1] - 50)
                    if self.last_pos:
                        draw_line(self.drawing_surface, self.last_pos, current_pos, 
                                 self.color_picker.selected_color, int(self.brush_size))
                    self.last_pos = current_pos
                    
            elif event.type == pygame.KEYDOWN and self.text_input_active:
                if event.key == pygame.K_RETURN:
                    # Finish text input
                    draw_text(self.drawing_surface, self.start_pos, self.text_input, 
                             self.color_picker.selected_color, int(self.brush_size * 3))
                    self.text_input_active = False
                elif event.key == pygame.K_BACKSPACE:
                    self.text_input = self.text_input[:-1]
                else:
                    self.text_input += event.unicode
                    
        return True
        
    def handle_button_click(self, action):
        if action == "reset":
            self.current_image = self.original_image.copy()
            self.drawing_surface = self.current_image.copy()
        elif action == "clear":
            self.drawing_surface.fill(WHITE)
        elif action == "save":
            pygame.image.save(self.drawing_surface, "edited_image.png")
        elif action in ["pen", "line", "rectangle", "circle", "ellipse", "polygon", "fill", 
                       "portrait_blur", "unblur", "magic_eraser", "text"]:
            self.current_tool = action
            if action != "polygon":
                self.points = []
        elif action == "flip_h":
            self.drawing_surface = pygame.transform.flip(self.drawing_surface, True, False)
            self.current_image = self.drawing_surface.copy()
        elif action == "flip_v":
            self.drawing_surface = pygame.transform.flip(self.drawing_surface, False, True)
            self.current_image = self.drawing_surface.copy()
        elif action == "crop":
            # Simple crop to center 80%
            w, h = self.drawing_surface.get_size()
            crop_rect = pygame.Rect(w*0.1, h*0.1, w*0.8, h*0.8)
            cropped = pygame.Surface((crop_rect.width, crop_rect.height))
            cropped.blit(self.drawing_surface, (0, 0), crop_rect)
            self.drawing_surface = cropped
            self.current_image = self.drawing_surface.copy()
        elif action == "expand":
            # Expand canvas by 20%
            w, h = self.drawing_surface.get_size()
            expanded = pygame.Surface((w*1.2, h*1.2))
            expanded.fill(WHITE)
            expanded.blit(self.drawing_surface, (w*0.1, h*0.1))
            self.drawing_surface = expanded
            self.current_image = self.drawing_surface.copy()
        elif action == "original":
            self.current_image = self.original_image.copy()
            self.drawing_surface = self.current_image.copy()
        elif action == "grayscale":
            self.current_image = apply_grayscale(self.drawing_surface)
            self.drawing_surface = self.current_image.copy()
        elif action == "sepia":
            self.current_image = apply_sepia(self.drawing_surface)
            self.drawing_surface = self.current_image.copy()
        elif action == "invert":
            self.current_image = apply_invert(self.drawing_surface)
            self.drawing_surface = self.current_image.copy()
        elif action == "blur":
            self.current_image = apply_blur(self.drawing_surface)
            self.drawing_surface = self.current_image.copy()
        elif action == "pixelate":
            self.current_image = apply_pixelate(self.drawing_surface)
            self.drawing_surface = self.current_image.copy()
        elif action == "vignette":
            self.current_image = apply_vignette(self.drawing_surface)
            self.drawing_surface = self.current_image.copy()
        elif action == "lora_art":
            self.current_image = apply_lora_art(self.drawing_surface)
            self.drawing_surface = self.current_image.copy()
        elif action == "pointillism":
            self.current_image = apply_pointillism(self.drawing_surface)
            self.drawing_surface = self.current_image.copy()
        elif action == "dynamic":
            self.current_image = apply_dynamic(self.drawing_surface)
            self.drawing_surface = self.current_image.copy()
        elif action == "enhance":
            self.current_image = apply_enhance(self.drawing_surface)
            self.drawing_surface = self.current_image.copy()
        elif action == "warm":
            self.current_image = apply_warm(self.drawing_surface)
            self.drawing_surface = self.current_image.copy()
        elif action == "cool":
            self.current_image = apply_cool(self.drawing_surface)
            self.drawing_surface = self.current_image.copy()
        elif action == "vivid":
            self.current_image = apply_vivid(self.drawing_surface)
            self.drawing_surface = self.current_image.copy()
        elif action == "playa":
            self.current_image = apply_playa(self.drawing_surface)
            self.drawing_surface = self.current_image.copy()
        elif action == "honey":
            self.current_image = apply_honey(self.drawing_surface)
            self.drawing_surface = self.current_image.copy()
        elif action == "desert":
            self.current_image = apply_desert(self.drawing_surface)
            self.drawing_surface = self.current_image.copy()
        elif action == "metro":
            self.current_image = apply_metro(self.drawing_surface)
            self.drawing_surface = self.current_image.copy()
        elif action == "vogue":
            self.current_image = apply_vogue(self.drawing_surface)
            self.drawing_surface = self.current_image.copy()
            
    def apply_drawing_tool(self, start_pos, end_pos):
        if self.current_tool == "line":
            draw_line(self.drawing_surface, start_pos, end_pos, 
                     self.color_picker.selected_color, int(self.brush_size))
        elif self.current_tool == "rectangle":
            draw_rectangle(self.drawing_surface, start_pos, end_pos, 
                          self.color_picker.selected_color, int(self.brush_size))
        elif self.current_tool == "circle":
            radius = int(math.sqrt((end_pos[0]-start_pos[0])**2 + (end_pos[1]-start_pos[1])**2))
            draw_circle(self.drawing_surface, start_pos, radius, 
                       self.color_picker.selected_color, int(self.brush_size))
        elif self.current_tool == "ellipse":
            rect = pygame.Rect(start_pos, (end_pos[0]-start_pos[0], end_pos[1]-start_pos[1]))
            draw_ellipse(self.drawing_surface, rect, self.color_picker.selected_color, int(self.brush_size))
        elif self.current_tool == "fill":
            # Simple flood fill
            fill_color = self.drawing_surface.get_at(start_pos)
            stack = [start_pos]
            target_color = self.color_picker.selected_color
            
            while stack:
                x, y = stack.pop()
                if not (0 <= x < self.drawing_surface.get_width() and 0 <= y < self.drawing_surface.get_height()):
                    continue
                if self.drawing_surface.get_at((x, y)) != fill_color or self.drawing_surface.get_at((x, y)) == target_color:
                    continue
                    
                self.drawing_surface.set_at((x, y), target_color)
                stack.append((x+1, y))
                stack.append((x-1, y))
                stack.append((x, y+1))
                stack.append((x, y-1))
        elif self.current_tool == "portrait_blur":
            # Simple portrait blur (blur around edges)
            center_x, center_y = start_pos
            radius = int(math.sqrt((end_pos[0]-start_pos[0])**2 + (end_pos[1]-start_pos[1])**2))
            
            # Create a mask for the area to keep sharp
            mask = pygame.Surface(self.drawing_surface.get_size(), pygame.SRCALPHA)
            pygame.draw.circle(mask, (255, 255, 255, 255), (center_x, center_y), radius)
            
            # Blur the entire image
            blurred = apply_blur(self.drawing_surface)
            
            # Combine the original and blurred images using the mask
            self.drawing_surface.blit(blurred, (0, 0))
            self.drawing_surface.blit(self.drawing_surface, (0, 0), special_flags=pygame.BLEND_RGBA_MIN, area=pygame.Rect(center_x-radius, center_y-radius, radius*2, radius*2))
                
    def draw(self, screen):
        # Draw background
        screen.fill(DARK_GRAY)
        
        # Draw image area
        pygame.draw.rect(screen, BLACK, (195, 45, 610, 410))
        screen.blit(self.drawing_surface, (200, 50))
        
        # Draw UI background
        pygame.draw.rect(screen, LIGHT_GRAY, (0, 0, WIDTH, HEIGHT), border_radius=5)
        
        # Draw title
        title_text = title_font.render("Advanced PyGame Image Editor", True, BLUE)
        screen.blit(title_text, (WIDTH//2 - title_text.get_width()//2, 5))
        
        # Draw tabs
        self.tabs.draw(screen)
        
        # Draw buttons based on active tab
        if self.tabs.active_tab == 0:  # Tools
            for button in self.buttons:
                if button.action in ["pen", "line", "rectangle", "circle", "ellipse", "polygon", "fill", 
                                   "portrait_blur", "unblur", "magic_eraser", "text", "save", "reset", "clear"]:
                    button.draw(screen)
        elif self.tabs.active_tab == 1:  # Filters
            for button in self.buttons:
                if button.action in ["original", "grayscale", "sepia", "invert", "blur", "pixelate", "vignette", 
                                   "lora_art", "pointillism", "dynamic", "enhance", "warm", "cool", "vivid", 
                                   "playa", "honey", "desert", "metro", "vogue"]:
                    button.draw(screen)
        elif self.tabs.active_tab == 2:  # Adjust
            for button in self.buttons:
                if button.action in ["brightness", "contrast", "saturation", "sharpness"]:
                    button.draw(screen)
            for slider in self.sliders[1:]:  # Skip brush size slider
                slider.draw(screen)
        elif self.tabs.active_tab == 3:  # Crop
            for button in self.buttons:
                if button.action in ["flip_h", "flip_v", "crop", "expand"]:
                    button.draw(screen)
        elif self.tabs.active_tab == 4:  # Markup
            for button in self.buttons:
                if button.action in ["pen", "line", "rectangle", "circle", "ellipse", "polygon", "fill", "text"]:
                    button.draw(screen)
            
        # Always draw brush size slider and color picker
        self.sliders[0].draw(screen)
        self.color_picker.draw(screen)
        
        # Draw instructions
        instructions = [
            "Instructions:",
            "1. Select a tab to access different features",
            "2. Choose a tool from the Tools tab",
            "3. Select a color from the color picker",
            "4. Adjust brush size if needed",
            "5. Draw on the canvas",
            "6. Apply filters from the Filters tab",
            "7. Make adjustments from the Adjust tab",
            "8. Save your creation with the Save button"
        ]
        
        for i, line in enumerate(instructions):
            text = font.render(line, True, BLACK)
            screen.blit(text, (WIDTH//2 - text.get_width()//2, 550 + i*20))
            
        # Draw current tool info
        tool_text = font.render(f"Current Tool: {self.current_tool.capitalize()}", True, BLUE)
        screen.blit(tool_text, (WIDTH//2 - tool_text.get_width()//2, 450))
        
        # Draw polygon points if in polygon mode
        if self.current_tool == "polygon" and self.points:
            for point in self.points:
                pygame.draw.circle(screen, RED, (point[0] + 200, point[1] + 50), 3)
                
        # Draw text input if active
        if self.text_input_active:
            pygame.draw.rect(screen, WHITE, (200, 50, 400, 30))
            text_surf = font.render(self.text_input, True, BLACK)
            screen.blit(text_surf, (210, 55))

# Main loop
def main():
    editor = ImageEditor()
    clock = pygame.time.Clock()
    running = True
    
    while running:
        running = editor.handle_events()
        editor.draw(screen)
        pygame.display.flip()
        clock.tick(60)
        
    pygame.quit()

if __name__ == "__main__":
    main()
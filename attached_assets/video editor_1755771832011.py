import pygame
import sys
import math
from pygame.locals import *

# Initialize pygame
pygame.init()

# Screen dimensions
SCREEN_WIDTH, SCREEN_HEIGHT = 1200, 700
screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
pygame.display.set_caption("Advanced Video Editor")

# Colors
BACKGROUND = (30, 30, 40)
SIDEBAR_BG = (45, 45, 55)
BUTTON_BG = (70, 70, 90)
BUTTON_HOVER = (90, 90, 110)
BUTTON_ACTIVE = (110, 110, 130)
TEXT_COLOR = (220, 220, 220)
ACCENT_COLOR = (100, 150, 255)
PANEL_BG = (40, 40, 50)

# Fonts
font_large = pygame.font.SysFont("Arial", 24)
font_medium = pygame.font.SysFont("Arial", 18)
font_small = pygame.font.SysFont("Arial", 14)

# Editor state
class EditorState:
    def __init__(self):
        self.active_panel = "suggestions"
        self.video_preview = pygame.Rect(300, 50, 600, 400)
        self.timeline = pygame.Rect(300, 500, 600, 100)
        
        # Mock values for adjustments
        self.brightness = 0
        self.contrast = 0
        self.saturation = 0
        
        # Mock filter state
        self.active_filter = None
        
        # Mock markup state
        self.markup_tool = "pen"
        self.markup_color = (255, 255, 255)

editor = EditorState()

# Feature panels
def draw_suggestions_panel():
    panel_rect = pygame.Rect(900, 50, 280, 400)
    pygame.draw.rect(screen, PANEL_BG, panel_rect, border_radius=8)
    
    title = font_large.render("Suggestions", True, TEXT_COLOR)
    screen.blit(title, (panel_rect.x + 10, panel_rect.y + 10))
    
    suggestions = ["Dynamic", "Enhance", "Warm", "Cool"]
    for i, suggestion in enumerate(suggestions):
        button_rect = pygame.Rect(panel_rect.x + 20, panel_rect.y + 60 + i*50, 240, 40)
        pygame.draw.rect(screen, BUTTON_BG, button_rect, border_radius=5)
        
        text = font_medium.render(suggestion, True, TEXT_COLOR)
        screen.blit(text, (button_rect.x + 10, button_rect.y + 10))

def draw_crop_panel():
    panel_rect = pygame.Rect(900, 50, 280, 400)
    pygame.draw.rect(screen, PANEL_BG, panel_rect, border_radius=8)
    
    title = font_large.render("Crop Tools", True, TEXT_COLOR)
    screen.blit(title, (panel_rect.x + 10, panel_rect.y + 10))
    
    tools = ["Flip Horizontal", "Flip Vertical", "Crop", "Expand"]
    for i, tool in enumerate(tools):
        button_rect = pygame.Rect(panel_rect.x + 20, panel_rect.y + 60 + i*50, 240, 40)
        pygame.draw.rect(screen, BUTTON_BG, button_rect, border_radius=5)
        
        text = font_medium.render(tool, True, TEXT_COLOR)
        screen.blit(text, (button_rect.x + 10, button_rect.y + 10))

def draw_tools_panel():
    panel_rect = pygame.Rect(900, 50, 280, 400)
    pygame.draw.rect(screen, PANEL_BG, panel_rect, border_radius=8)
    
    title = font_large.render("Tools", True, TEXT_COLOR)
    screen.blit(title, (panel_rect.x + 10, panel_rect.y + 10))
    
    tools = ["Portrait Blur", "Unblur", "Magic Eraser"]
    for i, tool in enumerate(tools):
        button_rect = pygame.Rect(panel_rect.x + 20, panel_rect.y + 60 + i*50, 240, 40)
        pygame.draw.rect(screen, BUTTON_BG, button_rect, border_radius=5)
        
        text = font_medium.render(tool, True, TEXT_COLOR)
        screen.blit(text, (button_rect.x + 10, button_rect.y + 10))

def draw_adjust_panel():
    panel_rect = pygame.Rect(900, 50, 280, 400)
    pygame.draw.rect(screen, PANEL_BG, panel_rect, border_radius=8)
    
    title = font_large.render("Adjustments", True, TEXT_COLOR)
    screen.blit(title, (panel_rect.x + 10, panel_rect.y + 10))
    
    adjustments = [
        ("Brightness", editor.brightness),
        ("Contrast", editor.contrast),
        ("Saturation", editor.saturation)
    ]
    
    for i, (name, value) in enumerate(adjustments):
        y_pos = panel_rect.y + 60 + i*60
        
        text = font_medium.render(name, True, TEXT_COLOR)
        screen.blit(text, (panel_rect.x + 20, y_pos))
        
        # Draw slider
        slider_rect = pygame.Rect(panel_rect.x + 20, y_pos + 30, 240, 10)
        pygame.draw.rect(screen, BUTTON_BG, slider_rect, border_radius=5)
        
        # Draw slider handle
        handle_pos = slider_rect.x + (value + 100) / 200 * slider_rect.width
        pygame.draw.circle(screen, ACCENT_COLOR, (int(handle_pos), slider_rect.y + 5), 8)

def draw_filters_panel():
    panel_rect = pygame.Rect(900, 50, 280, 400)
    pygame.draw.rect(screen, PANEL_BG, panel_rect, border_radius=8)
    
    title = font_large.render("Filters", True, TEXT_COLOR)
    screen.blit(title, (panel_rect.x + 10, panel_rect.y + 10))
    
    filters = ["Vivid", "Playa", "Honey", "Isla", "Desert", "Clay", 
               "Palma", "Modena", "Metro", "West", "Ollie", "Onyx", 
               "Eiffel", "Vogue", "Vista"]
    
    # Create a scrollable area for filters
    filter_area = pygame.Rect(panel_rect.x + 10, panel_rect.y + 50, 260, 340)
    pygame.draw.rect(screen, (50, 50, 60), filter_area, border_radius=5)
    
    # Draw filter buttons in a grid
    for i, filter_name in enumerate(filters):
        row = i // 2
        col = i % 2
        
        button_rect = pygame.Rect(
            filter_area.x + 10 + col*120, 
            filter_area.y + 10 + row*50, 
            110, 40
        )
        
        color = BUTTON_ACTIVE if editor.active_filter == filter_name else BUTTON_BG
        pygame.draw.rect(screen, color, button_rect, border_radius=5)
        
        text = font_small.render(filter_name, True, TEXT_COLOR)
        screen.blit(text, (button_rect.x + 5, button_rect.y + 12))

def draw_markup_panel():
    panel_rect = pygame.Rect(900, 50, 280, 400)
    pygame.draw.rect(screen, PANEL_BG, panel_rect, border_radius=8)
    
    title = font_large.render("Markup Tools", True, TEXT_COLOR)
    screen.blit(title, (panel_rect.x + 10, panel_rect.y + 10))
    
    tools = ["Pen", "Highlighter", "Text"]
    colors = [(255, 255, 255), (255, 255, 0), (255, 100, 100), (100, 255, 100), (100, 100, 255)]
    
    # Tools
    for i, tool in enumerate(tools):
        button_rect = pygame.Rect(panel_rect.x + 20, panel_rect.y + 60 + i*50, 240, 40)
        color = BUTTON_ACTIVE if editor.markup_tool == tool else BUTTON_BG
        pygame.draw.rect(screen, color, button_rect, border_radius=5)
        
        text = font_medium.render(tool, True, TEXT_COLOR)
        screen.blit(text, (button_rect.x + 10, button_rect.y + 10))
    
    # Colors
    color_title = font_medium.render("Colors", True, TEXT_COLOR)
    screen.blit(color_title, (panel_rect.x + 20, panel_rect.y + 210))
    
    for i, color in enumerate(colors):
        color_rect = pygame.Rect(panel_rect.x + 20 + i*50, panel_rect.y + 240, 40, 40)
        pygame.draw.rect(screen, color, color_rect, border_radius=5)

# Draw the UI
def draw_ui():
    # Draw background
    screen.fill(BACKGROUND)
    
    # Draw sidebar
    pygame.draw.rect(screen, SIDEBAR_BG, (0, 0, 250, SCREEN_HEIGHT))
    
    # Draw video preview area
    pygame.draw.rect(screen, (20, 20, 30), editor.video_preview, border_radius=8)
    preview_text = font_large.render("Video Preview", True, TEXT_COLOR)
    screen.blit(preview_text, (editor.video_preview.x + 20, editor.video_preview.y + 10))
    
    # Draw timeline
    pygame.draw.rect(screen, (20, 20, 30), editor.timeline, border_radius=8)
    timeline_text = font_medium.render("Timeline", True, TEXT_COLOR)
    screen.blit(timeline_text, (editor.timeline.x + 10, editor.timeline.y + 10))
    
    # Draw sidebar buttons
    buttons = [
        ("Suggestions", "suggestions"),
        ("Crop", "crop"),
        ("Tools", "tools"),
        ("Adjust", "adjust"),
        ("Filters", "filters"),
        ("Markup", "markup")
    ]
    
    for i, (text, panel) in enumerate(buttons):
        button_rect = pygame.Rect(20, 50 + i*60, 210, 50)
        color = BUTTON_ACTIVE if editor.active_panel == panel else BUTTON_BG
        pygame.draw.rect(screen, color, button_rect, border_radius=5)
        
        text_surface = font_medium.render(text, True, TEXT_COLOR)
        screen.blit(text_surface, (button_rect.x + 20, button_rect.y + 15))
    
    # Draw the active panel
    if editor.active_panel == "suggestions":
        draw_suggestions_panel()
    elif editor.active_panel == "crop":
        draw_crop_panel()
    elif editor.active_panel == "tools":
        draw_tools_panel()
    elif editor.active_panel == "adjust":
        draw_adjust_panel()
    elif editor.active_panel == "filters":
        draw_filters_panel()
    elif editor.active_panel == "markup":
        draw_markup_panel()

# Main loop
clock = pygame.time.Clock()
running = True

while running:
    for event in pygame.event.get():
        if event.type == QUIT:
            running = False
        elif event.type == MOUSEBUTTONDOWN:
            # Check if sidebar buttons were clicked
            mouse_pos = pygame.mouse.get_pos()
            buttons = [
                ("suggestions", pygame.Rect(20, 50, 210, 50)),
                ("crop", pygame.Rect(20, 110, 210, 50)),
                ("tools", pygame.Rect(20, 170, 210, 50)),
                ("adjust", pygame.Rect(20, 230, 210, 50)),
                ("filters", pygame.Rect(20, 290, 210, 50)),
                ("markup", pygame.Rect(20, 350, 210, 50))
            ]
            
            for panel, rect in buttons:
                if rect.collidepoint(mouse_pos):
                    editor.active_panel = panel
    
    # Draw the UI
    draw_ui()
    
    # Update the display
    pygame.display.flip()
    clock.tick(60)

pygame.quit()
sys.exit()
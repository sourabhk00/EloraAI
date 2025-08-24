import pygame
import pygame.gfxdraw
import numpy as np
import networkx as nx
import random
import matplotlib.pyplot as plt
from enum import Enum, auto
from typing import Dict, List, Optional, Tuple, Any, Union
import math
import json
import csv
from datetime import datetime
from dataclasses import dataclass
from abc import ABC, abstractmethod
import community as community_louvain  # python-louvain package
from matplotlib.animation import FuncAnimation

# Initialize pygame
pygame.init()
pygame.font.init()

# Color constants
BACKGROUND = (240, 240, 245)
PANEL_BG = (220, 220, 230)
NODE_COLOR = (65, 105, 225)  # Royal blue
EDGE_COLOR = (100, 100, 120)
HIGHLIGHT_COLOR = (255, 140, 0)  # Orange
TEXT_COLOR = (50, 50, 50)
SLIDER_BG = (180, 180, 190)
SLIDER_FG = (70, 130, 180)
BUTTON_COLOR = (70, 130, 180)
BUTTON_HOVER = (90, 150, 200)
BUTTON_TEXT = (240, 240, 240)
COMMUNITY_COLORS = [
    (255, 0, 0), (0, 255, 0), (0, 0, 255), (255, 255, 0),
    (255, 0, 255), (0, 255, 255), (255, 128, 0), (128, 0, 255)
]

# Graph Type Enum
class GraphType(Enum):
    ERDOS_RENYI = "Erdős-Rényi"
    BARABASI_ALBERT = "Barabási-Albert"
    WATTS_STROGATZ = "Watts-Strogatz"
    COMPLETE = "Complete"
    STAR = "Star"
    WHEEL = "Wheel"
    GRID = "Grid"
    RANDOM_REGULAR = "Random Regular"
    RANDOM_TREE = "Random Tree"
    BIPARTITE = "Bipartite"
    SCALE_FREE = "Scale Free"
    GEOMETRIC = "Geometric"
    POWERLAW_CLUSTER = "Powerlaw Cluster"

# Layout Type Enum
class LayoutType(Enum):
    SPRING = "Spring"
    CIRCULAR = "Circular"
    SHELL = "Shell"
    SPIRAL = "Spiral"
    RANDOM = "Random"
    KAMADA_KAWAI = "Kamada-Kawai"
    FRUCHTERMAN_REINGOLD = "Fruchterman-Reingold"
    SPECTRAL = "Spectral"
    PLANAR = "Planar"

# Weight Distribution Enum
class WeightDistribution(Enum):
    UNIFORM = "Uniform"
    NORMAL = "Normal"
    EXPONENTIAL = "Exponential"
    POWERLAW = "Power Law"
    LOGNORMAL = "Log Normal"

# Directionality Enum
class Directionality(Enum):
    UNDIRECTED = "Undirected"
    DIRECTED = "Directed"
    MIXED = "Mixed"

# Graph Properties Data Class
@dataclass
class GraphProperties:
    num_nodes: int = 20
    density: float = 0.5
    is_directed: bool = False
    is_weighted: bool = False
    weight_range: Tuple[float, float] = (1.0, 10.0)
    weight_distribution: WeightDistribution = WeightDistribution.UNIFORM
    community_structure: bool = False
    num_communities: int = 3
    clustering_coefficient: Optional[float] = None
    seed: Optional[int] = None

# Abstract Base Class for Graph Generators
class GraphGenerator(ABC):
    @abstractmethod
    def generate(self, properties: GraphProperties) -> nx.Graph:
        pass

# Erdős-Rényi Generator
class ErdősRényiGenerator(GraphGenerator):
    def generate(self, properties: GraphProperties) -> nx.Graph:
        p = properties.density
        if properties.is_directed:
            graph = nx.erdos_renyi_graph(properties.num_nodes, p, directed=True, seed=properties.seed)
        else:
            graph = nx.erdos_renyi_graph(properties.num_nodes, p, seed=properties.seed)
        return graph

# Barabási-Albert Generator
class BarabásiAlbertGenerator(GraphGenerator):
    def generate(self, properties: GraphProperties) -> nx.Graph:
        m = max(1, int(properties.density * properties.num_nodes / 2))
        graph = nx.barabasi_albert_graph(properties.num_nodes, m, seed=properties.seed)
        return graph

# Watts-Strogatz Generator
class WattsStrogatzGenerator(GraphGenerator):
    def generate(self, properties: GraphProperties) -> nx.Graph:
        k = max(2, int(properties.density * properties.num_nodes))
        p = 0.1  # Rewiring probability
        graph = nx.watts_strogatz_graph(properties.num_nodes, k, p, seed=properties.seed)
        return graph

# Complete Graph Generator
class CompleteGraphGenerator(GraphGenerator):
    def generate(self, properties: GraphProperties) -> nx.Graph:
        graph = nx.complete_graph(properties.num_nodes)
        return graph

# Star Graph Generator
class StarGraphGenerator(GraphGenerator):
    def generate(self, properties: GraphProperties) -> nx.Graph:
        graph = nx.star_graph(properties.num_nodes - 1)
        return graph

# Wheel Graph Generator
class WheelGraphGenerator(GraphGenerator):
    def generate(self, properties: GraphProperties) -> nx.Graph:
        graph = nx.wheel_graph(properties.num_nodes)
        return graph

# Grid Graph Generator
class GridGraphGenerator(GraphGenerator):
    def generate(self, properties: GraphProperties) -> nx.Graph:
        size = int(np.sqrt(properties.num_nodes))
        graph = nx.grid_2d_graph(size, size)
        mapping = {node: i for i, node in enumerate(graph.nodes())}
        graph = nx.relabel_nodes(graph, mapping)
        return graph

# Random Regular Graph Generator
class RandomRegularGenerator(GraphGenerator):
    def generate(self, properties: GraphProperties) -> nx.Graph:
        d = max(2, int(properties.density * properties.num_nodes))
        graph = nx.random_regular_graph(d, properties.num_nodes, seed=properties.seed)
        return graph

# Random Tree Generator
class RandomTreeGenerator(GraphGenerator):
    def generate(self, properties: GraphProperties) -> nx.Graph:
        graph = nx.random_tree(properties.num_nodes, seed=properties.seed)
        return graph

# Bipartite Graph Generator
class BipartiteGraphGenerator(GraphGenerator):
    def generate(self, properties: GraphProperties) -> nx.Graph:
        n1 = properties.num_nodes // 2
        n2 = properties.num_nodes - n1
        graph = nx.complete_bipartite_graph(n1, n2)
        return graph

# Scale-Free Graph Generator
class ScaleFreeGraphGenerator(GraphGenerator):
    def generate(self, properties: GraphProperties) -> nx.Graph:
        graph = nx.scale_free_graph(properties.num_nodes, seed=properties.seed)
        if not properties.is_directed:
            graph = graph.to_undirected()
        return graph

# Geometric Graph Generator
class GeometricGraphGenerator(GraphGenerator):
    def generate(self, properties: GraphProperties) -> nx.Graph:
        radius = properties.density
        graph = nx.random_geometric_graph(properties.num_nodes, radius, seed=properties.seed)
        return graph

# Powerlaw Cluster Graph Generator
class PowerlawClusterGenerator(GraphGenerator):
    def generate(self, properties: GraphProperties) -> nx.Graph:
        m = max(1, int(properties.density * properties.num_nodes / 2))
        p = 0.1
        graph = nx.powerlaw_cluster_graph(properties.num_nodes, m, p, seed=properties.seed)
        return graph

# UI Elements
class UIElement:
    def __init__(self, x, y, width, height):
        self.rect = pygame.Rect(x, y, width, height)
        
    def is_hovered(self, pos):
        return self.rect.collidepoint(pos)
        
    def draw(self, surface):
        pass

class Button(UIElement):
    def __init__(self, x, y, width, height, text, action=None, tooltip=""):
        super().__init__(x, y, width, height)
        self.text = text
        self.action = action
        self.hovered = False
        self.tooltip = tooltip
        
    def draw(self, surface, font):
        color = BUTTON_HOVER if self.hovered else BUTTON_COLOR
        pygame.draw.rect(surface, color, self.rect, border_radius=5)
        pygame.draw.rect(surface, (50, 50, 50), self.rect, 2, border_radius=5)
        
        text_surf = font.render(self.text, True, BUTTON_TEXT)
        text_rect = text_surf.get_rect(center=self.rect.center)
        surface.blit(text_surf, text_rect)
        
    def handle_event(self, event):
        if event.type == pygame.MOUSEMOTION:
            self.hovered = self.is_hovered(event.pos)
        elif event.type == pygame.MOUSEBUTTONDOWN and event.button == 1:
            if self.hovered and self.action:
                self.action()
                return True
        return False

class Slider(UIElement):
    def __init__(self, x, y, width, height, min_val, max_val, initial_val, label, precision=2):
        super().__init__(x, y, width, height)
        self.min_val = min_val
        self.max_val = max_val
        self.value = initial_val
        self.label = label
        self.dragging = False
        self.handle_radius = 10
        self.handle_pos = self.value_to_pos(initial_val)
        self.precision = precision
        
    def value_to_pos(self, value):
        normalized = (value - self.min_val) / (self.max_val - self.min_val)
        return self.rect.x + normalized * self.rect.width
        
    def pos_to_value(self, pos):
        normalized = (pos - self.rect.x) / self.rect.width
        return max(self.min_val, min(self.max_val, self.min_val + normalized * (self.max_val - self.min_val)))
        
    def draw(self, surface, font):
        # Draw slider track
        pygame.draw.rect(surface, SLIDER_BG, self.rect, border_radius=3)
        
        # Draw filled portion
        fill_width = self.handle_pos - self.rect.x
        if fill_width > 0:
            fill_rect = pygame.Rect(self.rect.x, self.rect.y, fill_width, self.rect.height)
            pygame.draw.rect(surface, SLIDER_FG, fill_rect, border_radius=3)
        
        # Draw handle
        pygame.draw.circle(surface, SLIDER_FG, (int(self.handle_pos), self.rect.centery), self.handle_radius)
        pygame.draw.circle(surface, (50, 50, 50), (int(self.handle_pos), self.rect.centery), self.handle_radius, 2)
        
        # Draw label and value
        if self.precision == 0:
            value_str = f"{int(self.value)}"
        else:
            value_str = f"{self.value:.{self.precision}f}"
            
        label_text = f"{self.label}: {value_str}"
        text_surf = font.render(label_text, True, TEXT_COLOR)
        surface.blit(text_surf, (self.rect.x, self.rect.y - 20))
        
    def handle_event(self, event):
        if event.type == pygame.MOUSEBUTTONDOWN and event.button == 1:
            if self.is_hovered(event.pos):
                self.dragging = True
                self.handle_pos = max(self.rect.x, min(self.rect.right, event.pos[0]))
                self.value = self.pos_to_value(self.handle_pos)
                return True
                
        elif event.type == pygame.MOUSEBUTTONUP and event.button == 1:
            self.dragging = False
            
        elif event.type == pygame.MOUSEMOTION and self.dragging:
            self.handle_pos = max(self.rect.x, min(self.rect.right, event.pos[0]))
            self.value = self.pos_to_value(self.handle_pos)
            return True
            
        return False

class Dropdown(UIElement):
    def __init__(self, x, y, width, height, options, initial_index=0, label=""):
        super().__init__(x, y, width, height)
        self.options = options
        self.selected_index = initial_index
        self.label = label
        self.expanded = False
        self.option_height = 30
        
    @property
    def selected_option(self):
        return self.options[self.selected_index]
        
    def draw(self, surface, font):
        # Draw main box
        color = BUTTON_HOVER if self.is_hovered(pygame.mouse.get_pos()) else BUTTON_COLOR
        pygame.draw.rect(surface, color, self.rect, border_radius=5)
        pygame.draw.rect(surface, (50, 50, 50), self.rect, 2, border_radius=5)
        
        # Draw label
        if self.label:
            label_surf = font.render(self.label, True, TEXT_COLOR)
            surface.blit(label_surf, (self.rect.x, self.rect.y - 20))
        
        # Draw selected option
        text_surf = font.render(str(self.selected_option.value), True, BUTTON_TEXT)
        text_rect = text_surf.get_rect(midleft=(self.rect.x + 10, self.rect.centery))
        surface.blit(text_surf, text_rect)
        
        # Draw dropdown arrow
        pygame.draw.polygon(surface, BUTTON_TEXT, [
            (self.rect.right - 20, self.rect.centery - 5),
            (self.rect.right - 10, self.rect.centery - 5),
            (self.rect.right - 15, self.rect.centery + 5)
        ])
        
        # Draw expanded options if needed
        if self.expanded:
            for i, option in enumerate(self.options):
                option_rect = pygame.Rect(self.rect.x, self.rect.y + (i+1) * self.option_height, 
                                         self.rect.width, self.option_height)
                color = BUTTON_HOVER if option_rect.collidepoint(pygame.mouse.get_pos()) else BUTTON_COLOR
                pygame.draw.rect(surface, color, option_rect, border_radius=5)
                pygame.draw.rect(surface, (50, 50, 50), option_rect, 2, border_radius=5)
                
                option_text = font.render(str(option.value), True, BUTTON_TEXT)
                option_text_rect = option_text.get_rect(midleft=(option_rect.x + 10, option_rect.centery))
                surface.blit(option_text, option_text_rect)
                
    def handle_event(self, event):
        if event.type == pygame.MOUSEBUTTONDOWN and event.button == 1:
            if self.expanded:
                # Check if any option was clicked
                for i, option in enumerate(self.options):
                    option_rect = pygame.Rect(self.rect.x, self.rect.y + (i+1) * self.option_height, 
                                             self.rect.width, self.option_height)
                    if option_rect.collidepoint(event.pos):
                        self.selected_index = i
                        self.expanded = False
                        return True
                
                # If click was outside options, collapse dropdown
                self.expanded = False
            elif self.is_hovered(event.pos):
                self.expanded = True
                return True
                
        return False

class Checkbox(UIElement):
    def __init__(self, x, y, size, label, checked=False, action=None):
        super().__init__(x, y, size, size)
        self.label = label
        self.checked = checked
        self.action = action
        self.hovered = False
        
    def draw(self, surface, font):
        # Draw checkbox
        pygame.draw.rect(surface, (255, 255, 255), self.rect, border_radius=3)
        pygame.draw.rect(surface, (50, 50, 50), self.rect, 2, border_radius=3)
        
        if self.checked:
            pygame.draw.line(surface, (0, 0, 0), 
                            (self.rect.x + 5, self.rect.centery),
                            (self.rect.x + self.rect.width - 5, self.rect.centery), 2)
            pygame.draw.line(surface, (0, 0, 0), 
                            (self.rect.x + 5, self.rect.centery),
                            (self.rect.x + self.rect.width//2, self.rect.bottom - 5), 2)
            pygame.draw.line(surface, (0, 0, 0), 
                            (self.rect.x + self.rect.width//2, self.rect.bottom - 5),
                            (self.rect.right - 5, self.rect.y + 5), 2)
        
        # Draw label
        text_surf = font.render(self.label, True, TEXT_COLOR)
        surface.blit(text_surf, (self.rect.x + self.rect.width + 10, self.rect.y))
        
    def handle_event(self, event):
        if event.type == pygame.MOUSEMOTION:
            self.hovered = self.is_hovered(event.pos)
        elif event.type == pygame.MOUSEBUTTONDOWN and event.button == 1:
            if self.is_hovered(event.pos):
                self.checked = not self.checked
                if self.action:
                    self.action()
                return True
        return False

class InteractiveGraphGenerator:
    def __init__(self, width=1400, height=800):
        self.width = width
        self.height = height
        self.screen = pygame.display.set_mode((width, height))
        pygame.display.set_caption("Advanced Interactive Graph Generator")
        
        self.clock = pygame.time.Clock()
        self.running = True
        
        # Graph properties
        self.graph_type = GraphType.ERDOS_RENYI
        self.layout_type = LayoutType.SPRING
        self.weight_distribution = WeightDistribution.UNIFORM
        self.directionality = Directionality.UNDIRECTED
        self.num_nodes = 30
        self.edge_probability = 0.2
        self.attachment_edges = 2
        self.nearest_neighbors = 4
        self.rewiring_prob = 0.1
        self.regular_degree = 3
        self.community_structure = False
        self.num_communities = 3
        self.show_weights = False
        self.show_labels = True
        self.show_communities = False
        self.min_weight = 1.0
        self.max_weight = 10.0
        self.seed = None
        
        # Graph data
        self.graph = None
        self.pos = None
        self.weights = {}
        self.communities = {}
        self.graph_info = {}
        
        # UI elements
        self.font = pygame.font.SysFont("Arial", 16)
        self.title_font = pygame.font.SysFont("Arial", 24, bold=True)
        self.small_font = pygame.font.SysFont("Arial", 14)
        
        # Graph generators
        self.generators = {
            GraphType.ERDOS_RENYI: ErdősRényiGenerator(),
            GraphType.BARABASI_ALBERT: BarabásiAlbertGenerator(),
            GraphType.WATTS_STROGATZ: WattsStrogatzGenerator(),
            GraphType.COMPLETE: CompleteGraphGenerator(),
            GraphType.STAR: StarGraphGenerator(),
            GraphType.WHEEL: WheelGraphGenerator(),
            GraphType.GRID: GridGraphGenerator(),
            GraphType.RANDOM_REGULAR: RandomRegularGenerator(),
            GraphType.RANDOM_TREE: RandomTreeGenerator(),
            GraphType.BIPARTITE: BipartiteGraphGenerator(),
            GraphType.SCALE_FREE: ScaleFreeGraphGenerator(),
            GraphType.GEOMETRIC: GeometricGraphGenerator(),
            GraphType.POWERLAW_CLUSTER: PowerlawClusterGenerator()
        }
        
        # Create UI elements
        self.create_ui_elements()
        
        # Generate initial graph
        self.generate_graph()
        
    def create_ui_elements(self):
        # Calculate panel dimensions
        panel_width = 350
        panel_x = self.width - panel_width
        element_width = panel_width - 20
        element_x = panel_x + 10
        y_pos = 20
        
        # Title
        self.title_rect = pygame.Rect(element_x, y_pos, element_width, 40)
        y_pos += 50
        
        # Graph type dropdown
        self.graph_type_dropdown = Dropdown(
            element_x, y_pos, element_width, 30,
            list(GraphType), 0, "Graph Type"
        )
        y_pos += 60
        
        # Layout type dropdown
        self.layout_type_dropdown = Dropdown(
            element_x, y_pos, element_width, 30,
            list(LayoutType), 0, "Layout Algorithm"
        )
        y_pos += 60
        
        # Weight distribution dropdown
        self.weight_dropdown = Dropdown(
            element_x, y_pos, element_width, 30,
            list(WeightDistribution), 0, "Weight Distribution"
        )
        y_pos += 60
        
        # Directionality dropdown
        self.direction_dropdown = Dropdown(
            element_x, y_pos, element_width, 30,
            list(Directionality), 0, "Directionality"
        )
        y_pos += 60
        
        # Sliders for parameters
        self.node_slider = Slider(
            element_x, y_pos, element_width, 20, 5, 200, self.num_nodes, "Number of Nodes", 0
        )
        y_pos += 50
        
        self.prob_slider = Slider(
            element_x, y_pos, element_width, 20, 0.01, 1.0, self.edge_probability, "Edge Probability", 2
        )
        y_pos += 50
        
        self.attach_slider = Slider(
            element_x, y_pos, element_width, 20, 1, 20, self.attachment_edges, "Attachment Edges", 0
        )
        y_pos += 50
        
        self.neighbor_slider = Slider(
            element_x, y_pos, element_width, 20, 2, 20, self.nearest_neighbors, "Nearest Neighbors", 0
        )
        y_pos += 50
        
        self.rewiring_slider = Slider(
            element_x, y_pos, element_width, 20, 0.0, 1.0, self.rewiring_prob, "Rewiring Probability", 2
        )
        y_pos += 50
        
        self.degree_slider = Slider(
            element_x, y_pos, element_width, 20, 2, 20, self.regular_degree, "Regular Degree", 0
        )
        y_pos += 50
        
        self.min_weight_slider = Slider(
            element_x, y_pos, element_width, 20, 0.1, 20.0, self.min_weight, "Min Weight", 1
        )
        y_pos += 50
        
        self.max_weight_slider = Slider(
            element_x, y_pos, element_width, 20, 0.1, 20.0, self.max_weight, "Max Weight", 1
        )
        y_pos += 50
        
        self.community_slider = Slider(
            element_x, y_pos, element_width, 20, 2, 10, self.num_communities, "Num Communities", 0
        )
        y_pos += 50
        
        # Checkboxes
        self.weight_checkbox = Checkbox(
            element_x, y_pos, 20, "Weighted Graph", False, self.toggle_weighted
        )
        y_pos += 40
        
        self.community_checkbox = Checkbox(
            element_x, y_pos, 20, "Community Structure", False, self.toggle_community
        )
        y_pos += 40
        
        self.show_weight_checkbox = Checkbox(
            element_x, y_pos, 20, "Show Weights", False, self.toggle_show_weights
        )
        y_pos += 40
        
        self.show_label_checkbox = Checkbox(
            element_x, y_pos, 20, "Show Labels", True, self.toggle_show_labels
        )
        y_pos += 40
        
        self.show_community_checkbox = Checkbox(
            element_x, y_pos, 20, "Show Communities", False, self.toggle_show_communities
        )
        y_pos += 40
        
        # Buttons
        self.generate_button = Button(
            element_x, y_pos, element_width, 40, "Generate Graph", self.generate_graph
        )
        y_pos += 50
        
        self.export_button = Button(
            element_x, y_pos, element_width // 2 - 5, 30, "Export Graph", self.export_graph
        )
        
        self.export_info_button = Button(
            element_x + element_width // 2 + 5, y_pos, element_width // 2 - 5, 30, "Export Info", self.export_info
        )
        y_pos += 40
        
        self.analyze_button = Button(
            element_x, y_pos, element_width, 30, "Analyze Graph", self.analyze_graph
        )
        
        # Store all UI elements for easy access
        self.ui_elements = [
            self.graph_type_dropdown,
            self.layout_type_dropdown,
            self.weight_dropdown,
            self.direction_dropdown,
            self.node_slider,
            self.prob_slider,
            self.attach_slider,
            self.neighbor_slider,
            self.rewiring_slider,
            self.degree_slider,
            self.min_weight_slider,
            self.max_weight_slider,
            self.community_slider,
            self.weight_checkbox,
            self.community_checkbox,
            self.show_weight_checkbox,
            self.show_label_checkbox,
            self.show_community_checkbox,
            self.generate_button,
            self.export_button,
            self.export_info_button,
            self.analyze_button
        ]
        
    def toggle_weighted(self):
        self.weight_checkbox.checked = not self.weight_checkbox.checked
        
    def toggle_community(self):
        self.community_checkbox.checked = not self.community_checkbox.checked
        
    def toggle_show_weights(self):
        self.show_weights = not self.show_weights
        
    def toggle_show_labels(self):
        self.show_labels = not self.show_labels
        
    def toggle_show_communities(self):
        self.show_communities = not self.show_communities
        
    def generate_graph(self):
        # Update parameters from UI
        self.graph_type = self.graph_type_dropdown.selected_option
        self.layout_type = self.layout_type_dropdown.selected_option
        self.weight_distribution = self.weight_dropdown.selected_option
        self.directionality = self.direction_dropdown.selected_option
        self.num_nodes = int(self.node_slider.value)
        self.edge_probability = self.prob_slider.value
        self.attachment_edges = int(self.attach_slider.value)
        self.nearest_neighbors = int(self.neighbor_slider.value)
        self.rewiring_prob = self.rewiring_slider.value
        self.regular_degree = int(self.degree_slider.value)
        self.min_weight = self.min_weight_slider.value
        self.max_weight = self.max_weight_slider.value
        self.num_communities = int(self.community_slider.value)
        self.community_structure = self.community_checkbox.checked
        self.show_weights = self.show_weight_checkbox.checked
        self.show_labels = self.show_label_checkbox.checked
        self.show_communities = self.show_community_checkbox.checked
        
        # Create properties object
        properties = GraphProperties(
            num_nodes=self.num_nodes,
            density=self.edge_probability,
            is_directed=self.directionality == Directionality.DIRECTED,
            is_weighted=self.weight_checkbox.checked,
            weight_range=(self.min_weight, self.max_weight),
            weight_distribution=self.weight_distribution,
            community_structure=self.community_structure,
            num_communities=self.num_communities,
            seed=self.seed
        )
        
        # Generate the graph based on selected type
        if self.graph_type in self.generators:
            self.graph = self.generators[self.graph_type].generate(properties)
        else:
            # Default to ER if not found
            self.graph = self.generators[GraphType.ERDOS_RENYI].generate(properties)
        
        # Apply additional properties
        self._apply_properties(properties)
        
        # Apply the selected layout
        self.apply_layout()
        
        # Analyze the graph
        self.analyze_graph(silent=True)
        
    def _apply_properties(self, properties: GraphProperties):
        """Apply additional properties to the graph"""
        
        # Add weights if requested
        if properties.is_weighted:
            self._add_weights(properties)
        
        # Add community structure if requested
        if properties.community_structure:
            self._add_community_structure(properties)
        
        # Ensure the graph has the correct directionality
        if properties.is_directed and not self.graph.is_directed():
            self.graph = self.graph.to_directed()
        elif not properties.is_directed and self.graph.is_directed():
            self.graph = self.graph.to_undirected()
    
    def _add_weights(self, properties: GraphProperties):
        """Add weights to graph edges based on the specified distribution"""
        min_weight, max_weight = properties.weight_range
        self.weights = {}
        
        if properties.weight_distribution == WeightDistribution.UNIFORM:
            for u, v in self.graph.edges():
                weight = random.uniform(min_weight, max_weight)
                self.graph[u][v]['weight'] = weight
                self.weights[(u, v)] = weight
                
        elif properties.weight_distribution == WeightDistribution.NORMAL:
            mean = (min_weight + max_weight) / 2
            std = (max_weight - min_weight) / 4
            for u, v in self.graph.edges():
                weight = random.gauss(mean, std)
                # Clamp the value to the specified range
                weight = max(min_weight, min(max_weight, weight))
                self.graph[u][v]['weight'] = weight
                self.weights[(u, v)] = weight
                
        elif properties.weight_distribution == WeightDistribution.EXPONENTIAL:
            scale = (max_weight - min_weight) / 4
            for u, v in self.graph.edges():
                weight = min_weight + random.expovariate(1/scale)
                weight = min(weight, max_weight)
                self.graph[u][v]['weight'] = weight
                self.weights[(u, v)] = weight
                
        elif properties.weight_distribution == WeightDistribution.LOGNORMAL:
            mean = (min_weight + max_weight) / 2
            std = (max_weight - min_weight) / 4
            for u, v in self.graph.edges():
                weight = random.lognormvariate(mean, std)
                weight = max(min_weight, min(max_weight, weight))
                self.graph[u][v]['weight'] = weight
                self.weights[(u, v)] = weight
                
        elif properties.weight_distribution == WeightDistribution.POWERLAW:
            for u, v in self.graph.edges():
                weight = random.paretovariate(2)  # Alpha = 2
                # Scale to our range
                weight = min_weight + (weight - 1) * (max_weight - min_weight) / 9
                weight = min(weight, max_weight)
                self.graph[u][v]['weight'] = weight
                self.weights[(u, v)] = weight
    
    def _add_community_structure(self, properties: GraphProperties):
        """Add community structure to the graph"""
        if properties.num_communities < 2:
            return
            
        # Use the Louvain method to detect communities
        try:
            partition = community_louvain.best_partition(self.graph)
            self.communities = partition
            
            # Increase weights within communities
            for u, v in self.graph.edges():
                if partition.get(u, -1) == partition.get(v, -2):
                    if 'weight' in self.graph[u][v]:
                        self.graph[u][v]['weight'] *= 2  # Strengthen intra-community connections
                        self.weights[(u, v)] = self.graph[u][v]['weight']
                    else:
                        self.graph[u][v]['weight'] = 2.0
                        self.weights[(u, v)] = 2.0
        except:
            # Fallback if community detection fails
            self.communities = {}
            for i, node in enumerate(self.graph.nodes()):
                self.communities[node] = i % properties.num_communities
        
    def apply_layout(self):
        if self.layout_type == LayoutType.SPRING:
            self.pos = nx.spring_layout(self.graph, k=1/np.sqrt(self.num_nodes), iterations=50)
        elif self.layout_type == LayoutType.CIRCULAR:
            self.pos = nx.circular_layout(self.graph)
        elif self.layout_type == LayoutType.SHELL:
            self.pos = nx.shell_layout(self.graph)
        elif self.layout_type == LayoutType.SPIRAL:
            self.pos = nx.spiral_layout(self.graph)
        elif self.layout_type == LayoutType.RANDOM:
            self.pos = nx.random_layout(self.graph)
        elif self.layout_type == LayoutType.KAMADA_KAWAI:
            self.pos = nx.kamada_kawai_layout(self.graph)
        elif self.layout_type == LayoutType.FRUCHTERMAN_REINGOLD:
            self.pos = nx.fruchterman_reingold_layout(self.graph)
        elif self.layout_type == LayoutType.SPECTRAL:
            self.pos = nx.spectral_layout(self.graph)
        elif self.layout_type == LayoutType.PLANAR:
            try:
                self.pos = nx.planar_layout(self.graph)
            except:
                self.pos = nx.spring_layout(self.graph)
            
        # Scale and center the layout to fit the drawing area
        self.normalize_positions()
        
    def normalize_positions(self):
        if not self.pos:
            return
            
        # Get the bounding box of the positions
        x_values = [pos[0] for pos in self.pos.values()]
        y_values = [pos[1] for pos in self.pos.values()]
        
        min_x, max_x = min(x_values), max(x_values)
        min_y, max_y = min(y_values), max(y_values)
        
        # Calculate scaling factors
        graph_width = self.width - 370  # Leave space for UI panel
        graph_height = self.height - 40  # Leave some margin
        
        scale_x = graph_width / (max_x - min_x) if max_x > min_x else 1
        scale_y = graph_height / (max_y - min_y) if max_y > min_y else 1
        scale = min(scale_x, scale_y) * 0.9  # Use 90% of available space
        
        # Center and scale the positions
        center_x = (min_x + max_x) / 2
        center_y = (min_y + max_y) / 2
        
        for node in self.pos:
            self.pos[node] = (
                20 + (self.pos[node][0] - center_x) * scale + graph_width / 2,
                20 + (self.pos[node][1] - center_y) * scale + graph_height / 2
            )
        
    def draw_graph(self):
        # Draw edges
        for u, v in self.graph.edges():
            start_pos = self.pos[u]
            end_pos = self.pos[v]
            
            # Draw arrow for directed graphs
            if self.graph.is_directed():
                # Calculate arrow properties
                dx = end_pos[0] - start_pos[0]
                dy = end_pos[1] - start_pos[1]
                angle = math.atan2(dy, dx)
                length = math.sqrt(dx*dx + dy*dy)
                
                # Shorten the line to account for arrowhead
                end_pos_adjusted = (
                    end_pos[0] - 10 * math.cos(angle),
                    end_pos[1] - 10 * math.sin(angle)
                )
                
                # Draw the line
                pygame.draw.line(self.screen, EDGE_COLOR, start_pos, end_pos_adjusted, 2)
                
                # Draw arrowhead
                arrow_size = 8
                pygame.draw.polygon(self.screen, EDGE_COLOR, [
                    end_pos,
                    (end_pos[0] - arrow_size * math.cos(angle - math.pi/6), 
                     end_pos[1] - arrow_size * math.sin(angle - math.pi/6)),
                    (end_pos[0] - arrow_size * math.cos(angle + math.pi/6), 
                     end_pos[1] - arrow_size * math.sin(angle + math.pi/6))
                ])
            else:
                pygame.draw.line(self.screen, EDGE_COLOR, start_pos, end_pos, 2)
            
            # Draw weight if enabled
            if self.show_weights and (u, v) in self.weights:
                mid_x = (start_pos[0] + end_pos[0]) / 2
                mid_y = (start_pos[1] + end_pos[1]) / 2
                weight_text = f"{self.weights[(u, v)]:.1f}"
                text_surf = self.font.render(weight_text, True, TEXT_COLOR)
                text_rect = text_surf.get_rect(center=(mid_x, mid_y))
                pygame.draw.rect(self.screen, (255, 255, 255, 180), 
                                text_rect.inflate(5, 5), border_radius=3)
                self.screen.blit(text_surf, text_rect)
        
        # Draw nodes
        for node, pos in self.pos.items():
            # Determine node color based on community if enabled
            if self.show_communities and node in self.communities:
                community_idx = self.communities[node] % len(COMMUNITY_COLORS)
                color = COMMUNITY_COLORS[community_idx]
            else:
                color = NODE_COLOR
                
            pygame.gfxdraw.filled_circle(self.screen, int(pos[0]), int(pos[1]), 10, color)
            pygame.gfxdraw.aacircle(self.screen, int(pos[0]), int(pos[1]), 10, (50, 50, 50))
            
            # Draw node label if enabled
            if self.show_labels:
                text_surf = self.font.render(str(node), True, TEXT_COLOR)
                text_rect = text_surf.get_rect(center=(pos[0], pos[1] - 20))
                self.screen.blit(text_surf, text_rect)
                
    def draw_ui(self):
        # Draw UI panel background
        panel_rect = pygame.Rect(self.width - 350, 0, 350, self.height)
        pygame.draw.rect(self.screen, PANEL_BG, panel_rect)
        pygame.draw.line(self.screen, (180, 180, 190), (self.width - 350, 0), (self.width - 350, self.height), 2)
        
        # Draw title
        title_text = self.title_font.render("Graph Controls", True, TEXT_COLOR)
        title_rect = title_text.get_rect(center=self.title_rect.center)
        self.screen.blit(title_text, title_rect)
        
        # Draw all UI elements
        for element in self.ui_elements:
            if isinstance(element, Button):
                element.draw(self.screen, self.font)
            elif isinstance(element, Slider):
                element.draw(self.screen, self.font)
            elif isinstance(element, Dropdown):
                element.draw(self.screen, self.font)
            elif isinstance(element, Checkbox):
                element.draw(self.screen, self.font)
                
        # Draw graph info
        info_y = self.height - 200
        if self.graph_info:
            info_texts = [
                f"Nodes: {self.graph_info.get('number_of_nodes', 'N/A')}",
                f"Edges: {self.graph_info.get('number_of_edges', 'N/A')}",
                f"Density: {self.graph_info.get('density', 'N/A'):.3f}",
                f"Avg Degree: {self.graph_info.get('average_degree', 'N/A'):.2f}",
                f"Connected: {'Yes' if self.graph_info.get('is_connected', False) else 'No'}",
                f"Components: {self.graph_info.get('number_of_connected_components', 'N/A')}",
                f"Avg Clustering: {self.graph_info.get('average_clustering', 'N/A'):.3f}",
                f"Transitivity: {self.graph_info.get('transitivity', 'N/A'):.3f}",
            ]
            
            for i, text in enumerate(info_texts):
                text_surf = self.small_font.render(text, True, TEXT_COLOR)
                self.screen.blit(text_surf, (self.width - 340, info_y + i * 18))
        
    def analyze_graph(self, silent=False):
        if self.graph is None:
            return
        
        info = {
            "number_of_nodes": self.graph.number_of_nodes(),
            "number_of_edges": self.graph.number_of_edges(),
            "is_directed": self.graph.is_directed(),
            "is_weighted": nx.is_weighted(self.graph),
            "density": nx.density(self.graph),
            "average_degree": sum(dict(self.graph.degree()).values()) / self.graph.number_of_nodes(),
            "degree_assortativity": nx.degree_assortativity_coefficient(self.graph) if not self.graph.is_directed() else "N/A",
            "is_connected": nx.is_connected(self.graph.to_undirected()) if self.graph.is_directed() else nx.is_connected(self.graph),
            "number_of_connected_components": nx.number_connected_components(self.graph.to_undirected()) if self.graph.is_directed() else nx.number_connected_components(self.graph),
            "average_clustering": nx.average_clustering(self.graph),
            "transitivity": nx.transitivity(self.graph),
        }
        
        # Add diameter if the graph is connected
        if info["is_connected"]:
            info["diameter"] = nx.diameter(self.graph.to_undirected()) if self.graph.is_directed() else nx.diameter(self.graph)
        else:
            info["diameter"] = "Not connected"
        
        # Add weight statistics if the graph is weighted
        if info["is_weighted"] and hasattr(self, 'weights') and self.weights:
            weights = list(self.weights.values())
            info["weight_statistics"] = {
                "min_weight": min(weights),
                "max_weight": max(weights),
                "avg_weight": sum(weights) / len(weights),
                "total_weight": sum(weights)
            }
        
        self.graph_info = info
        
        if not silent:
            print("Graph Analysis:")
            for key, value in info.items():
                if not isinstance(value, dict):
                    print(f"  {key}: {value}")
    
    def export_graph(self):
        if self.graph is None:
            return
            
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"graph_{self.graph_type.name.lower()}_{timestamp}.gexf"
        nx.write_gexf(self.graph, filename)
        print(f"Graph exported to {filename}")
    
    def export_info(self):
        if not self.graph_info:
            return
            
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"graph_info_{self.graph_type.name.lower()}_{timestamp}.json"
        
        with open(filename, 'w') as f:
            json.dump(self.graph_info, f, indent=2)
            
        print(f"Graph info exported to {filename}")
    
    def handle_events(self):
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                self.running = False
                
            # Let UI elements handle events
            ui_handled = False
            for element in self.ui_elements:
                if element.handle_event(event):
                    ui_handled = True
                    
            # If a UI element was interacted with, regenerate graph if needed
            if ui_handled and not isinstance(element, Button):
                self.generate_graph()
                
    def run(self):
        while self.running:
            self.screen.fill(BACKGROUND)
            
            self.handle_events()
            
            if self.graph and self.pos:
                self.draw_graph()
                
            self.draw_ui()
            
            pygame.display.flip()
            self.clock.tick(60)
            
        pygame.quit()

if __name__ == "__main__":
    app = InteractiveGraphGenerator()
    app.run()
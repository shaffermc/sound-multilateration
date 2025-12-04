import numpy as np
import matplotlib.pyplot as plt
from matplotlib.widgets import Slider

# --- Initial Variables (with sensors 3000 feet apart) ---
x_A, y_A = 0, 0            # Coordinates of point A (sensor 1)
x_B, y_B = 914.4, 0        # Coordinates of point B (sensor 2) - 3000 feet = 914.4 meters
x_C, y_C = 0, 914.4        # Coordinates of point C (sensor 3) - Example, 3000 feet up (y=914.4 meters)
v = 343                    # Speed of sound in m/s (you can change this if needed)

# --- Initialize time values (in seconds) ---
t_A = 0                    # Time for sound to reach point A (in seconds)
t_B = 2.35                 # Time for sound to reach point B (in seconds)
t_C = 3.10                 # Time for sound to reach point C (in seconds)

# Global contour variables (initialized outside the functions)
contour_AB = None
contour_AC = None
contour_BC = None  # New hyperbola between B and C

# --- Calculation Function ---
def calculate_hyperbolas(t_A, t_B, t_C):
    # Time differences and distance differences
    time_diff_AB = abs(t_A - t_B)  # Time difference between A and B
    time_diff_AC = abs(t_A - t_C)  # Time difference between A and C
    time_diff_BC = abs(t_B - t_C)  # Time difference between B and C

    distance_diff_AB = time_diff_AB * v  # Distance difference between A and B
    distance_diff_AC = time_diff_AC * v  # Distance difference between A and C
    distance_diff_BC = time_diff_BC * v  # Distance difference between B and C

    # Generate grid of points in the area to evaluate the hyperbola equations
    x_vals = np.linspace(-5000, 5000, 500)  # Adjust the range for x-axis (-10,000 to 10,000)
    y_vals = np.linspace(-5000, 5000, 500)  # Adjust the range for y-axis (-10,000 to 10,000)
    X, Y = np.meshgrid(x_vals, y_vals)

    # Calculate distances from each point to A, B, and C
    dist_A = np.sqrt((X - x_A)**2 + (Y - y_A)**2)
    dist_B = np.sqrt((X - x_B)**2 + (Y - y_B)**2)
    dist_C = np.sqrt((X - x_C)**2 + (Y - y_C)**2)

    # Equations for the hyperbolas:
    hyperbola_AB = np.abs(dist_A - dist_B) - distance_diff_AB
    hyperbola_AC = np.abs(dist_A - dist_C) - distance_diff_AC
    hyperbola_BC = np.abs(dist_B - dist_C) - distance_diff_BC  # New hyperbola (B-C)

    return X, Y, hyperbola_AB, hyperbola_AC, hyperbola_BC

# --- Update Function for the Slider ---
def update(val):
    global contour_AB, contour_AC, contour_BC  # Use the global contour variables

    # Get values from sliders
    t_A_slider = slider_t_A.val
    t_B_slider = slider_t_B.val
    t_C_slider = slider_t_C.val
    
    # Recalculate hyperbolas with the updated times
    X, Y, hyperbola_AB, hyperbola_AC, hyperbola_BC = calculate_hyperbolas(t_A_slider, t_B_slider, t_C_slider)

    # Clear previous contour plots
    ax.cla()  # Clear the current axis

    # Plot the sensor points (A, B, and C) again after clearing
    ax.scatter([x_A, x_B, x_C], [y_A, y_B, y_C], color='blue', label="Sensors (A, B, C)")

    # Add labels for points A, B, and C
    ax.text(x_A, y_A, 'A', fontsize=12, ha='right', color='blue')
    ax.text(x_B, y_B, 'B', fontsize=12, ha='right', color='blue')
    ax.text(x_C, y_C, 'C', fontsize=12, ha='right', color='blue')

    # Plot the new hyperbolas
    contour_AB = ax.contour(X, Y, hyperbola_AB, levels=[0], colors='r')  # Red hyperbola (A-B)
    contour_AC = ax.contour(X, Y, hyperbola_AC, levels=[0], colors='g')  # Green hyperbola (A-C)
    contour_BC = ax.contour(X, Y, hyperbola_BC, levels=[0], colors='b')  # Blue hyperbola (B-C)

    # Labels and title
    ax.set_title('Possible Locations of Sound Origin (Hyperbolic Curves)')
    ax.set_xlabel('X Coordinate')
    ax.set_ylabel('Y Coordinate')
    ax.axhline(0, color='black', linewidth=2)  # Horizontal axis (x=0 line)
    ax.axvline(0, color='black', linewidth=2)  # Vertical axis (y=0 line)
    ax.grid(True)
    ax.legend()

    # Set axis limits
    ax.set_xlim(-5000, 5000)  # Set x-axis limits from -10,000 to 10,000
    ax.set_ylim(-5000, 5000)  # Set y-axis limits from -10,000 to 10,000

    # Redraw the plot
    fig.canvas.draw_idle()

# --- Create Plot and Sliders ---
fig, ax = plt.subplots(figsize=(8, 6))
plt.subplots_adjust(bottom=0.25)

# Initial plot with default times
X, Y, hyperbola_AB, hyperbola_AC, hyperbola_BC = calculate_hyperbolas(t_A, t_B, t_C)

# Plot the initial hyperbolas
contour_AB = ax.contour(X, Y, hyperbola_AB, levels=[0], colors='r', label="Possible Origin Locations (A-B)")
contour_AC = ax.contour(X, Y, hyperbola_AC, levels=[0], colors='g', label="Possible Origin Locations (A-C)")
contour_BC = ax.contour(X, Y, hyperbola_BC, levels=[0], colors='b', label="Possible Origin Locations (B-C)")

# Plot the sensor points (A, B, and C)
ax.scatter([x_A, x_B, x_C], [y_A, y_B, y_C], color='blue', label="Sensors (A, B, C)")

# Add labels for points A, B, and C
ax.text(x_A, y_A, 'A', fontsize=12, ha='right', color='blue')
ax.text(x_B, y_B, 'B', fontsize=12, ha='right', color='blue')
ax.text(x_C, y_C, 'C', fontsize=12, ha='right', color='blue')

# Labels and title
ax.set_title('Possible Locations of Sound Origin (Hyperbolic Curves)')
ax.set_xlabel('X Coordinate')
ax.set_ylabel('Y Coordinate')
ax.axhline(0, color='black', linewidth=2)  # Horizontal axis (x=0 line)
ax.axvline(0, color='black', linewidth=2)  # Vertical axis (y=0 line)
ax.grid(True)
ax.legend()

# Set axis limits
ax.set_xlim(-5000, 5000)  # Set x-axis limits from -10,000 to 10,000
ax.set_ylim(-5000, 5000)  # Set y-axis limits from -10,000 to 10,000

# Add sliders for time delays of the sensors
ax_slider_t_A = plt.axes([0.2, 0.01, 0.65, 0.03], facecolor='lightgoldenrodyellow')
ax_slider_t_B = plt.axes([0.2, 0.06, 0.65, 0.03], facecolor='lightgoldenrodyellow')
ax_slider_t_C = plt.axes([0.2, 0.11, 0.65, 0.03], facecolor='lightgoldenrodyellow')

slider_t_A = Slider(ax_slider_t_A, 'Time A (t_A)', 0, 10, valinit=t_A, valstep=0.01)
slider_t_B = Slider(ax_slider_t_B, 'Time B (t_B)', 0, 10, valinit=t_B, valstep=0.01)
slider_t_C = Slider(ax_slider_t_C, 'Time C (t_C)', 0, 10, valinit=t_C, valstep=0.01)

# Connect the sliders to the update function
slider_t_A.on_changed(update)
slider_t_B.on_changed(update)
slider_t_C.on_changed(update)

# Show the plot with sliders
plt.show()

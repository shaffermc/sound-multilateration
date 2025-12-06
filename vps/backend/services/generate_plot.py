import sys
import numpy as np
import matplotlib.pyplot as plt
import os
import warnings
import math
import matplotlib.image as mpimg  # Import this to read the image

warnings.filterwarnings("ignore", message="No contour levels were found within the data range.")

# --- Initial Variables (with sensors 3000 feet apart) ---
x_A, y_A = 0, 0            # Coordinates of point A (sensor 1)
x_B, y_B = 914.4, 0        # Coordinates of point B (sensor 2) - 3000 feet = 914.4 meters
x_C, y_C = 0, 914.4        # Coordinates of point C (sensor 3) - Example, 3000 feet up (y=914.4 meters)
v = 343                    # Speed of sound in m/s (you can change this if needed)

# --- Initialize time values (in seconds) ---
t_A = 0.58                 # Time for sound to reach point A (in seconds)
t_B = 2.35                 # Time for sound to reach point B (in seconds)
t_C = 1.52                 # Time for sound to reach point C (in seconds)

station1coords = (40.748817, -73.985428)
station2coords = (40.749817, -73.986428)
station3coords = (40.748317, -73.984428)
station4coords = (40.749317, -73.985928)

def latlon_to_meters(lat1, lon1, lat2, lon2):
    """
    Convert two GPS points (lat/lon) to distance in meters assuming flat Earth.
    """
    # Approximate meters per degree
    meters_per_deg_lat = 111_320
    meters_per_deg_lon = 111_320 * math.cos(math.radians((lat1 + lat2) / 2))

    dx = (lon2 - lon1) * meters_per_deg_lon
    dy = (lat2 - lat1) * meters_per_deg_lat

    distance = math.sqrt(dx**2 + dy**2)
    return round(distance,2)

def distances_between_four_points_flat(station1coords, station2coords, station3coords, station4coords):
    """
    Compute all 6 pairwise distances between four points assuming flat Earth.
    """
    d12 = latlon_to_meters(*station1coords, *station2coords)
    d13 = latlon_to_meters(*station1coords, *station3coords)
    d14 = latlon_to_meters(*station1coords, *station4coords)
    d23 = latlon_to_meters(*station2coords, *station3coords)
    d24 = latlon_to_meters(*station2coords, *station4coords)
    d34 = latlon_to_meters(*station3coords, *station4coords)
    
    return d12, d13, d14, d23, d24, d34

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
    x_vals = np.linspace(-1000, 1000, 100)  # Adjust the range for x-axis
    y_vals = np.linspace(-1000, 1000, 100)  # Adjust the range for y-axis
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

# --- Generate the Plot ---
def generate_plot(t_A, t_B, t_C):

    distances = distances_between_four_points_flat(station1coords, station2coords, station3coords, station4coords)
    print(distances)

    X, Y, hyperbola_AB, hyperbola_AC, hyperbola_BC = calculate_hyperbolas(t_A, t_B, t_C)

    # Set the desired width and height in inches for the plot
    width_in_inches = 19  # 1900 pixels at 100 dpi
    height_in_inches = 10  # 1000 pixels at 100 dpi

    # Create the plot with specific figsize and dpi to control pixel dimensions
    fig, ax = plt.subplots(figsize=(width_in_inches, height_in_inches), dpi=100)  # 100 dpi for clarity

    # Load the background image
    img = mpimg.imread('background.png')  # Adjust the path to your image file
    ax.imshow(img, extent=[-1000, 1000, -1000, 1000], aspect='auto', alpha=0.9)  # Display the image with transparency

    # Plot the sensor points (A, B, and C) with different colors for each sensor
    ax.scatter(x_A, y_A, color='blue', label="Sensor A", zorder=5)  # Sensor A 
    ax.scatter(x_B, y_B, color='green', label="Sensor B", zorder=5)  # Sensor B
    ax.scatter(x_C, y_C, color='purple', label="Sensor C", zorder=5)  # Sensor C 

    # Annotate sensor labels
    ax.text(x_A, y_A, 'A', fontsize=12, ha='right', color='blue')
    ax.text(x_B, y_B, 'B', fontsize=12, ha='right', color='green')
    ax.text(x_C, y_C, 'C', fontsize=12, ha='right', color='purple')

    # Plot the hyperbolas (A-B, A-C, B-C)
    ax.contour(X, Y, hyperbola_AB, levels=[0], colors='red', linestyles='solid')
    ax.contour(X, Y, hyperbola_AC, levels=[0], colors='orange', linestyles='solid')
    ax.contour(X, Y, hyperbola_BC, levels=[0], colors='yellow', linestyles='solid')

    # Labels and title
    ax.set_title('Possible Locations of Sound Origin (Hyperbolic Curves)')
    ax.set_xlabel('X Coordinate')
    ax.set_ylabel('Y Coordinate')
    ax.axhline(0, color='black', linewidth=1)  # Horizontal axis (x=0 line)
    ax.axvline(0, color='black', linewidth=1)  # Vertical axis (y=0 line)
    ax.grid(False)
    
    # Add the legend for the sensors and hyperbolas with different markers
    ax.legend(loc='upper right', markerscale=2)

    # Set axis limits
    ax.set_xlim(-1000, 1000)  # Set x-axis limits
    ax.set_ylim(-1000, 1000)  # Set y-axis limits

    # Save the plot to the 'static' folder with minimal white space around the plot
    output_path = os.path.join(os.getcwd(), 'static', 'plot.png')
    print(f"Saving plot to {output_path}")  # Optional: For debugging
    
    # Remove extra white space around the plot by using bbox_inches='tight'
    plt.savefig(output_path, format='png', bbox_inches='tight', pad_inches=0.01)



# Run the plot generation with arguments passed to the script
if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("Usage: python generate_plot.py <t_A> <t_B> <t_C>")
    else:
        t_A = float(sys.argv[1])
        t_B = float(sys.argv[2])
        t_C = float(sys.argv[3])
        generate_plot(t_A, t_B, t_C)

import sys
import numpy as np
from scipy.optimize import least_squares
import matplotlib.pyplot as plt
import math
import base64
from io import BytesIO
import json

v = 343.0  # speed of sound m/s

GRID_CENTER_X = 2000
GRID_CENTER_Y = 2000

def gps_to_xy(lat_ref, lon_ref, lat, lon):
    meters_per_deg_lat = 111320
    meters_per_deg_lon = 111320 * math.cos(math.radians(lat_ref))
    x = (lon - lon_ref) * meters_per_deg_lon
    y = (lat - lat_ref) * meters_per_deg_lat
    return np.array([x, y])

# Require 12 args: lat1 lon1 ... lat4 lon4 tA tB tC tD
if len(sys.argv) != 13:
    sys.exit(1)

# Extract GPS coordinates
lats = [float(sys.argv[i]) for i in [1,3,5,7]]
lons = [float(sys.argv[i]) for i in [2,4,6,8]]

# Convert GPS to XY
stations_xy = [gps_to_xy(lats[0], lons[0], lats[i], lons[i]) for i in range(4)]

# Extract delays
delays = np.array([float(sys.argv[i]) for i in range(9,13)])
delays = delays - delays[0]

def tdoa_residuals(pos, stations, delays):
    d = [np.linalg.norm(pos - s) for s in stations]
    d0 = d[0]
    return [(d[i] - d0) - v * delays[i] for i in range(3)]

def tdoa_residuals_global(pos, stations, delays):
    res = []
    for i in range(len(stations)):
        for j in range(i+1, len(stations)):
            Di = np.linalg.norm(pos - stations[i])
            Dj = np.linalg.norm(pos - stations[j])
            res.append((Di - Dj) - v * (delays[i] - delays[j]))
    return res

cases = [(1,2,3),(0,2,3),(0,1,3),(0,1,2)]
def solve_3station_tdoa(station_ids, delays):
    st = [stations_xy[i] for i in station_ids]
    dl = [delays[i] for i in station_ids]
    guess = np.mean(st, axis=0)
    sol = least_squares(tdoa_residuals, guess, args=(st, dl))
    return sol.x

omit_one_solutions = [solve_3station_tdoa(case, delays) for case in cases]

guess_global = np.mean(stations_xy, axis=0)
global_solution = least_squares(
    tdoa_residuals_global,
    guess_global,
    args=(stations_xy, delays)
).x

def plot_hyperbolas(delays, solutions, global_solution):
    S = stations_xy
    dd = {}
    for i in range(4):
        for j in range(i+1,4):
            dd[(i,j)] = v * (delays[i] - delays[j])

    grid_size = 3000
    N = 800
    xs = np.linspace(GRID_CENTER_X - grid_size, GRID_CENTER_X + grid_size, N)
    ys = np.linspace(GRID_CENTER_Y - grid_size, GRID_CENTER_Y + grid_size, N)
    X, Y = np.meshgrid(xs, ys)

    fig, ax = plt.subplots(figsize=(9,9))
    colors = ['red','blue','green','orange','purple','brown']

    # Draw hyperbolas
    for idx, ((i,j), dd_ij) in enumerate(dd.items()):
        Si, Sj = S[i], S[j]
        Di = np.sqrt((X - Si[0])**2 + (Y - Si[1])**2)
        Dj = np.sqrt((X - Sj[0])**2 + (Y - Sj[1])**2)
        H = (Di - Dj) - dd_ij
        ax.contour(X, Y, H, levels=[0], colors=colors[idx % len(colors)], linewidths=1.1)

    # Stations
    for i, s in enumerate(S):
        ax.scatter(s[0], s[1], s=100)
        ax.text(s[0], s[1], f" S{i+1}", fontsize=12)

    # Omit-one solutions
    for i, sol in enumerate(solutions):
        ax.scatter(sol[0], sol[1], marker='x', s=150, color='black')
        ax.text(sol[0], sol[1], f" Sol {i+1}", color='black')

    # Global solution
    ax.scatter(global_solution[0], global_solution[1], marker='*', s=200, color='gold')

    ax.set_aspect("equal")
    ax.grid(True)

    # Convert to base64
    buf = BytesIO()
    plt.savefig(buf, format='png', dpi=150, bbox_inches='tight')
    buf.seek(0)
    encoded = base64.b64encode(buf.read()).decode('utf-8')
    plt.close()
    return encoded

# Generate base64 plot
img_b64 = plot_hyperbolas(delays, omit_one_solutions, global_solution)

# Output ONLY JSON
print(json.dumps({
    "image": img_b64,
    "solutions": [s.tolist() for s in omit_one_solutions],
    "global_solution": global_solution.tolist()
}))

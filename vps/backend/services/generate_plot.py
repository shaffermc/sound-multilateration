#!/usr/bin/env python3
import sys
import numpy as np
from scipy.optimize import least_squares
import math
import json

v = 343.0  # speed of sound m/s

def gps_to_xy(lat_ref, lon_ref, lat, lon):
    meters_per_deg_lat = 111320
    meters_per_deg_lon = 111320 * math.cos(math.radians(lat_ref))
    x = (lon - lon_ref) * meters_per_deg_lon
    y = (lat - lat_ref) * meters_per_deg_lat
    return np.array([x, y])

def xy_to_gps(lat_ref, lon_ref, x, y):
    meters_per_deg_lat = 111320
    meters_per_deg_lon = 111320 * math.cos(math.radians(lat_ref))
    lat = lat_ref + y / meters_per_deg_lat
    lon = lon_ref + x / meters_per_deg_lon
    return float(lat), float(lon)

# Expect 12 args
if len(sys.argv) != 13:
    print(json.dumps({"error": "Expected 12 arguments"}))
    sys.exit(1)

# Parse GPS inputs
lats = [float(sys.argv[i]) for i in [1,3,5,7]]
lons = [float(sys.argv[i]) for i in [2,4,6,8]]

lat_ref, lon_ref = lats[0], lons[0]

stations_xy = [gps_to_xy(lat_ref, lon_ref, lats[i], lons[i]) for i in range(4)]

# Parse times
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

# Solve omit-one cases
cases = [(1,2,3),(0,2,3),(0,1,3),(0,1,2)]
def solve_3station(st_ids):
    st = [stations_xy[i] for i in st_ids]
    dl = [delays[i] for i in st_ids]
    guess = np.mean(st, axis=0)
    sol = least_squares(tdoa_residuals, guess, args=(st, dl))
    return sol.x

omit_solutions_xy = [solve_3station(case) for case in cases]

# Solve global case
guess_global = np.mean(stations_xy, axis=0)
global_solution_xy = least_squares(tdoa_residuals_global, guess_global, args=(stations_xy, delays)).x

# Compute hyperbola polylines
hyperbolas = []
N = 500
xs = np.linspace(-500, 500, N)
ys = np.linspace(-500, 500, N)
X, Y = np.meshgrid(xs, ys)

for i in range(4):
    for j in range(i+1, 4):
        Si = stations_xy[i]
        Sj = stations_xy[j]
        dd = v * (delays[i] - delays[j])

        poly = []
        for x_scalar in np.linspace(-500, 500, 800):
            # Solve implicitly by scanning Y for sign changes:
            prev_val = None
            prev_y = None
            for y_scalar in np.linspace(-500, 500, 800):
                Di = math.dist((x_scalar, y_scalar), Si)
                Dj = math.dist((x_scalar, y_scalar), Sj)
                H = (Di - Dj) - dd

                if prev_val is not None and H == 0 or (prev_val * H < 0):
                    # Zero crossing → approximate solution
                    lat, lon = xy_to_gps(lat_ref, lon_ref, x_scalar, y_scalar)
                    poly.append([lat, lon])
                prev_val = H
                prev_y = y_scalar

        hyperbolas.append({
            "pair": [i, j],
            "points": poly
        })

# Convert outputs into GPS for React
stations_gps = [{"lat": lats[i], "lon": lons[i]} for i in range(4)]

omit_gps = [
    {"lat": xy_to_gps(lat_ref, lon_ref, p[0], p[1])[0],
     "lon": xy_to_gps(lat_ref, lon_ref, p[0], p[1])[1]}
    for p in omit_solutions_xy
]

global_gps = {
    "lat": xy_to_gps(lat_ref, lon_ref, global_solution_xy[0], global_solution_xy[1])[0],
    "lon": xy_to_gps(lat_ref, lon_ref, global_solution_xy[0], global_solution_xy[1])[1]
}

print(json.dumps({
    "stations": stations_gps,
    "omit_solutions": omit_gps,
    "global_solution": global_gps,
    "hyperbolas": hyperbolas
}))

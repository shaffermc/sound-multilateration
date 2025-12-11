#!/usr/bin/env python3
import sys
import numpy as np
from scipy.optimize import least_squares, brentq
import math
import json

v = 343.0  # speed of sound in m/s

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

# Residuals for 3-station solve
def tdoa_residuals(pos, stations, delays):
    d = [np.linalg.norm(pos - s) for s in stations]
    d0 = d[0]
    return [(d[i] - d0) - v * delays[i] for i in range(len(stations))]

# Residuals for global 4-station solve
def tdoa_residuals_global(pos, stations, delays):
    res = []
    for i in range(len(stations)):
        for j in range(i+1, len(stations)):
            Di = np.linalg.norm(pos - stations[i])
            Dj = np.linalg.norm(pos - stations[j])
            res.append((Di - Dj) - v * (delays[i] - delays[j]))
    return res

# Hyperbola computation using root-finding
def hyperbola_points(Si, Sj, dd, x_range, y_min, y_max):
    points = []
    for x in x_range:
        try:
            y = brentq(lambda y: math.dist((x, y), Si) - math.dist((x, y), Sj) - dd, y_min, y_max)
            points.append((x, y))
        except ValueError:
            continue  # no root in this x
    return points

try:
    if len(sys.argv) != 13:
        raise ValueError("Expected 12 arguments")

    # Parse GPS
    lats = [float(sys.argv[i]) for i in [1,3,5,7]]
    lons = [float(sys.argv[i]) for i in [2,4,6,8]]
    lat_ref, lon_ref = lats[0], lons[0]
    stations_xy = [gps_to_xy(lat_ref, lon_ref, lats[i], lons[i]) for i in range(4)]

    # Parse times
    delays = np.array([float(sys.argv[i]) for i in range(9,13)])
    delays = delays - delays[0]  # make relative to first station

    # Solve omit-one 3-station cases with proper delay referencing
    cases = [(1,2,3),(0,2,3),(0,1,3),(0,1,2)]
    def solve_3station(st_ids):
        st = [stations_xy[i] for i in st_ids]
        # Make delays relative to first station in subset
        dl_subset = np.array([delays[i] - delays[st_ids[0]] for i in st_ids])
        guess = np.mean(st, axis=0)
        sol = least_squares(tdoa_residuals, guess, args=(st, dl_subset))
        return sol.x

    omit_solutions_xy = [solve_3station(case) for case in cases]

    # Solve global 4-station least-squares
    guess_global = np.mean(stations_xy, axis=0)
    global_solution_xy = least_squares(tdoa_residuals_global, guess_global, args=(stations_xy, delays)).x

    # Hyperbolas
    hyperbolas = []
    x_range = np.linspace(-200, 200, 300)  # adjust as needed
    y_min, y_max = -200, 200  # bounding box

    for i in range(4):
        for j in range(i+1, 4):
            Si = stations_xy[i]
            Sj = stations_xy[j]
            dd = v * (delays[i] - delays[j])
            points_xy = hyperbola_points(Si, Sj, dd, x_range, y_min, y_max)
            # Convert to GPS
            points_gps = [xy_to_gps(lat_ref, lon_ref, x, y) for x, y in points_xy]
            hyperbolas.append({"pair": [i, j], "points": points_gps})

    # Convert stations & solutions to GPS
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

    # Output JSON
    print(json.dumps({
        "stations": stations_gps,
        "omit_solutions": omit_gps,
        "global_solution": global_gps,
        "hyperbolas": hyperbolas
    }))

except Exception as e:
    print(json.dumps({"error": str(e)}))

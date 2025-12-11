#!/usr/bin/env python3
import sys
import numpy as np
from scipy.optimize import least_squares, brentq
import math
import json

v = 343.0

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

def tdoa_residuals(pos, stations, delays):
    d = [np.linalg.norm(pos - s) for s in stations]
    d0 = d[0]
    return [(d[i] - d0) - v * delays[i] for i in range(len(stations))]

def tdoa_residuals_global(pos, stations, delays):
    res = []
    for i in range(len(stations)):
        for j in range(i+1, len(stations)):
            Di = np.linalg.norm(pos - stations[i])
            Dj = np.linalg.norm(pos - stations[j])
            res.append((Di - Dj) - v * (delays[i] - delays[j]))
    return res

# --- Two-branch solver -----------------------------

def compute_two_branch_hyperbola(Si, Sj, dd, x_min, x_max, y_min, y_max, num_points=700):
    x_range = np.linspace(x_min, x_max, num_points)
    upper, lower = [], []

    for x in x_range:
        def f(y):
            return math.dist((x, y), Si) - math.dist((x, y), Sj) - dd

        mid = (y_min + y_max) / 2

        # Upper
        try:
            y_up = brentq(f, mid, y_max)
            upper.append((x, y_up))
        except ValueError:
            pass

        # Lower
        try:
            y_lo = brentq(f, y_min, mid)
            lower.append((x, y_lo))
        except ValueError:
            pass

    upper.sort(key=lambda p: p[0])
    lower.sort(key=lambda p: p[0])

    return upper, lower

# ---------------------------------------------------

try:
    if len(sys.argv) != 13:
        raise ValueError("expected 12 arguments")

    lats = [float(sys.argv[i]) for i in [1,3,5,7]]
    lons = [float(sys.argv[i]) for i in [2,4,6,8]]
    lat_ref, lon_ref = lats[0], lons[0]

    stations_xy = [gps_to_xy(lat_ref, lon_ref, lats[i], lons[i]) for i in range(4)]

    delays = np.array([float(sys.argv[i]) for i in range(9,13)])
    delays = delays - delays[0]

    cases = [(1,2,3),(0,2,3),(0,1,3),(0,1,2)]

    def solve_3station(ids):
        st = [stations_xy[i] for i in ids]
        dl = np.array([delays[i] - delays[ids[0]] for i in ids])
        guess = np.mean(st, axis=0)
        sol = least_squares(tdoa_residuals, guess, args=(st, dl))
        return sol.x

    omit_xy = [solve_3station(case) for case in cases]

    guess_global = np.mean(stations_xy, axis=0)
    global_xy = least_squares(tdoa_residuals_global, guess_global,
                              args=(stations_xy, delays)).x

    all_x = [s[0] for s in stations_xy]
    all_y = [s[1] for s in stations_xy]
    max_sep = max(math.dist(stations_xy[i], stations_xy[j])
                  for i in range(4)
                  for j in range(i+1, 4))

    padding = max_sep * 3
    x_min, x_max = min(all_x) - padding, max(all_x) + padding
    y_min, y_max = min(all_y) - padding, max(all_y) + padding

    hyperbolas = []

    for i in range(4):
        for j in range(i+1, 4):
            Si, Sj = stations_xy[i], stations_xy[j]
            dd = v * (delays[i] - delays[j])

            upper_xy, lower_xy = compute_two_branch_hyperbola(
                Si, Sj, dd, x_min, x_max, y_min, y_max
            )

            upper_gps = [xy_to_gps(lat_ref, lon_ref, x, y) for x, y in upper_xy]
            lower_gps = [xy_to_gps(lat_ref, lon_ref, x, y) for x, y in lower_xy]

            # --- Compatibility with existing frontend ---
            merged = upper_gps + lower_gps  # what React expects
            # --------------------------------------------

            hyperbolas.append({
                "pair": [i, j],
                "points": merged,       # old format (React uses this)
                "branches": [           # NEW: clean separate curves
                    upper_gps,
                    lower_gps
                ]
            })

    output = {
        "stations": [{"lat": lats[i], "lon": lons[i]} for i in range(4)],
        "omit_solutions": [
            {"lat": xy_to_gps(lat_ref, lon_ref, p[0], p[1])[0],
             "lon": xy_to_gps(lat_ref, lon_ref, p[0], p[1])[1]}
            for p in omit_xy
        ],
        "global_solution": {
            "lat": xy_to_gps(lat_ref, lon_ref, global_xy[0], global_xy[1])[0],
            "lon": xy_to_gps(lat_ref, lon_ref, global_xy[0], global_xy[1])[1]
        },
        "hyperbolas": hyperbolas
    }

    print(json.dumps(output))

except Exception as e:
    print(json.dumps({"error": str(e)}))

#!/usr/bin/env python3
import sys
import numpy as np
from scipy.optimize import least_squares, brentq
import math
import json

# Default speed of sound (used if no temperature is provided)
v = 343.0  # m/s

def speed_of_sound_from_temp(temp_c):
    """
    Approximate speed of sound in dry air at sea level as a function of temperature.
    c ≈ 331.3 + 0.606 * T_C  (m/s)
    """
    return 331.3 + 0.606 * temp_c   # <<< NEW

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
        def f(y):
            return math.dist((x, y), Si) - math.dist((x, y), Sj) - dd
        try:
            y = brentq(f, y_min, y_max)
            points.append((x, y))
        except ValueError:
            # No root in this y-interval for this x
            continue
    return points

try:
    # Now allow: 
    #  - 12 arguments (no temperature): keep v = 343
    #  - 13 arguments: last one is temp_C used to compute v
    if len(sys.argv) not in (13, 14):  # <<< CHANGED
        raise ValueError(
            "Expected 12 arguments (no temp) or 13 arguments (with temp_C)"
        )

    # If temperature provided, compute v from it
    if len(sys.argv) == 14:  # <<< NEW
        temp_c = float(sys.argv[13])
        v = speed_of_sound_from_temp(temp_c)

    # Parse GPS
    lats = [float(sys.argv[i]) for i in [1, 3, 5, 7]]
    lons = [float(sys.argv[i]) for i in [2, 4, 6, 8]]
    lat_ref, lon_ref = lats[0], lons[0]
    stations_xy = [gps_to_xy(lat_ref, lon_ref, lats[i], lons[i]) for i in range(4)]

    # Parse times
    delays = np.array([float(sys.argv[i]) for i in range(9, 13)])
    delays = delays - delays[0]  # make relative to first station

    # Solve omit-one 3-station cases with proper delay referencing
    cases = [(1, 2, 3), (0, 2, 3), (0, 1, 3), (0, 1, 2)]

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
    global_solution_xy = least_squares(
        tdoa_residuals_global, guess_global, args=(stations_xy, delays)
    ).x

    # -------------------------------
    # Dynamic bounding box (key fix)
    # -------------------------------
    all_x = [s[0] for s in stations_xy] + [p[0] for p in omit_solutions_xy] + [global_solution_xy[0]]
    all_y = [s[1] for s in stations_xy] + [p[1] for p in omit_solutions_xy] + [global_solution_xy[1]]

    min_x, max_x = min(all_x), max(all_x)
    min_y, max_y = min(all_y), max(all_y)

    PAD = 0.25  # 25% padding around all known points
    dx = max_x - min_x
    dy = max_y - min_y
    pad_x = dx * PAD
    pad_y = dy * PAD

    xmin = min_x - pad_x
    xmax = max_x + pad_x
    ymin = min_y - pad_y
    ymax = max_y + pad_y

    # Fallback sizes if stations/solutions are very clustered
    if dx < 50:  # 50 meters
        xmin, xmax = min_x - 100, max_x + 100
    if dy < 50:
        ymin, ymax = min_y - 100, max_y + 100

    # Optional: clamp to a max extent so we don't explode if something goes weird
    MAX_EXTENT = 5000.0  # meters from origin
    xmin = max(xmin, -MAX_EXTENT)
    xmax = min(xmax,  MAX_EXTENT)
    ymin = max(ymin, -MAX_EXTENT)
    ymax = min(ymax,  MAX_EXTENT)

    # Use this dynamic box for hyperbola search
    x_range = np.linspace(xmin, xmax, 400)
    y_min, y_max = ymin, ymax

    # Hyperbolas
    hyperbolas = []
    for i in range(4):
        for j in range(i + 1, 4):
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
        {
            "lat": xy_to_gps(lat_ref, lon_ref, p[0], p[1])[0],
            "lon": xy_to_gps(lat_ref, lon_ref, p[0], p[1])[1],
        }
        for p in omit_solutions_xy
    ]
    global_gps = {
        "lat": xy_to_gps(lat_ref, lon_ref, global_solution_xy[0], global_solution_xy[1])[0],
        "lon": xy_to_gps(lat_ref, lon_ref, global_solution_xy[0], global_solution_xy[1])[1],
    }

    # Output JSON (you could also include temp_c and v here if you want)
    print(
        json.dumps(
            {
                "stations": stations_gps,
                "omit_solutions": omit_gps,
                "global_solution": global_gps,
                "hyperbolas": hyperbolas,
            }
        )
    )

except Exception as e:
    print(json.dumps({"error": str(e)}))

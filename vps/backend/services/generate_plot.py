#!/usr/bin/env python3
import sys
import numpy as np
from scipy.optimize import least_squares
from scipy.interpolate import CubicSpline
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

def smooth_hyperbola_points(points, num_smooth_points=500):
    # Separate the x and y values
    x_vals = [p[0] for p in points]
    y_vals = [p[1] for p in points]

    # Create a cubic spline interpolator
    spline_x = CubicSpline(np.arange(len(x_vals)), x_vals, bc_type='natural')
    spline_y = CubicSpline(np.arange(len(y_vals)), y_vals, bc_type='natural')

    # Generate new smoothed points
    smooth_x = np.linspace(0, len(x_vals)-1, num_smooth_points)
    smooth_y = spline_y(smooth_x)
    smooth_x = spline_x(smooth_x)

    # Return the smoothed points
    smooth_points = list(zip(smooth_x, smooth_y))
    return smooth_points

try:
    # Expect 12 arguments: lat1 lon1 lat2 lon2 lat3 lon3 lat4 lon4 tA tB tC tD
    if len(sys.argv) != 13:
        raise ValueError("Expected 12 arguments")

    # Parse GPS
    lats = [float(sys.argv[i]) for i in [1,3,5,7]]
    lons = [float(sys.argv[i]) for i in [2,4,6,8]]
    lat_ref, lon_ref = lats[0], lons[0]
    stations_xy = [gps_to_xy(lat_ref, lon_ref, lats[i], lons[i]) for i in range(4)]

    # Parse times
    delays = np.array([float(sys.argv[i]) for i in range(9,13)])
    delays = delays - delays[0]  # make relative to first

    # Residuals for 3-station solve
    def tdoa_residuals(pos, stations, delays):
        d = [np.linalg.norm(pos - s) for s in stations]
        d0 = d[0]
        return [(d[i] - d0) - v * delays[i] for i in range(3)]

    # Residuals for global 4-station solve
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

    # Hyperbolas (low-resolution for speed)
    hyperbolas = []
    num_points = 200  # was 800 → much faster
    num_smooth_points = 500  # Number of smooth points
    x_range = np.linspace(-500, 500, num_points)
    y_range = np.linspace(-500, 500, num_points)

    for i in range(4):
        for j in range(i+1, 4):
            Si = stations_xy[i]
            Sj = stations_xy[j]
            dd = v * (delays[i] - delays[j])

            poly = []
            for x_scalar in x_range:
                prev_val = None
                for y_scalar in y_range:
                    Di = math.dist((x_scalar, y_scalar), Si)
                    Dj = math.dist((x_scalar, y_scalar), Sj)
                    H = (Di - Dj) - dd
                    if prev_val is not None and (H == 0 or prev_val * H < 0):
                        lat, lon = xy_to_gps(lat_ref, lon_ref, x_scalar, y_scalar)
                        poly.append([lat, lon])
                    prev_val = H

            # Smooth the hyperbola points using cubic spline interpolation
            smoothed_poly = smooth_hyperbola_points(poly, num_smooth_points=num_smooth_points)

            # Add the smoothed points to the hyperbolas list
            hyperbolas.append({"pair": [i, j], "points": smoothed_poly})

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

    # Output JSON for React
    print(json.dumps({
        "stations": stations_gps,
        "omit_solutions": omit_gps,
        "global_solution": global_gps,
        "hyperbolas": hyperbolas
    }))

except Exception as e:
    print(json.dumps({"error": str(e)}))

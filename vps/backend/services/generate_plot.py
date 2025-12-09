import numpy as np
from scipy.optimize import least_squares
from pyproj import Proj, Transformer, CRS
import math
import sys
import json

# Speed of sound (m/s)
v = 343.0

# ------------------------------------------------------------
# Create ENU projection using UTM zones (fixes your PyProj error)
# ------------------------------------------------------------
def make_enu(lat0, lon0):
    # Define WGS84 CRS (GPS)
    proj_ll = CRS.from_epsg(4326)  # lat/lon WGS84

    # Define a local Transverse Mercator projection centered at lat0/lon0
    proj_enu = CRS.from_proj4(
        f"+proj=tmerc +lat_0={lat0} +lon_0={lon0} "
        "+k=1 +x_0=0 +y_0=0 +ellps=WGS84 +units=m +no_defs"
    )

    # Create transformers
    to_enu = Transformer.from_crs(proj_ll, proj_enu, always_xy=True)
    to_ll = Transformer.from_crs(proj_enu, proj_ll, always_xy=True)
    return to_enu, to_ll

# ------------------------------------------------------------
# TDOA residual function
# ------------------------------------------------------------
def tdoa_residuals_global(pos, stations, delays):
    res = []
    for i in range(len(stations)):
        for j in range(i+1, len(stations)):
            Di = np.linalg.norm(pos - stations[i])
            Dj = np.linalg.norm(pos - stations[j])
            res.append((Di - Dj) - v * (delays[i] - delays[j]))
    return res

# ------------------------------------------------------------
# Hyperbola generator in ENU space
# ------------------------------------------------------------
def generate_hyperbola_points(Si, Sj, diff_meters, bounds, num=200):
    xmin, xmax, ymin, ymax = bounds
    xs = np.linspace(xmin, xmax, num)
    pts = []

    for x in xs:
        def f(y):
            Di = np.linalg.norm([x - Si[0], y - Si[1]])
            Dj = np.linalg.norm([x - Sj[0], y - Sj[1]])
            return (Di - Dj) - diff_meters

        N = 400
        ys = np.linspace(ymin, ymax, N)
        vals = [f(y) for y in ys]

        for k in range(N - 1):
            if vals[k] == 0 or vals[k] * vals[k + 1] < 0:
                y0, y1 = ys[k], ys[k + 1]
                for _ in range(20):
                    ym = (y0 + y1) / 2
                    if f(y0) * f(ym) <= 0:
                        y1 = ym
                    else:
                        y0 = ym
                pts.append((x, (y0 + y1) / 2))
                break

    return pts

# ------------------------------------------------------------
# Main TDOA solver
# ------------------------------------------------------------
def solve_tdoa(lats, lons, delays):
    delays = np.array(delays)
    delays = delays - delays[0]  # Reference = first station

    lat0, lon0 = lats[0], lons[0]
    to_enu, to_ll = make_enu(lat0, lon0)

    stations_enu = []
    for lat, lon in zip(lats, lons):
        x, y = to_enu.transform(lon, lat)
        stations_enu.append(np.array([x, y]))
    stations_enu = np.array(stations_enu)

    # Solve for origin
    guess = np.mean(stations_enu, axis=0)
    global_solution_enu = least_squares(
        tdoa_residuals_global,
        guess,
        args=(stations_enu, delays)
    ).x

    sol_lon, sol_lat = to_ll.transform(global_solution_enu[0], global_solution_enu[1])

    # Hyperbolas
    xmin = min(s[0] for s in stations_enu) - 200
    xmax = max(s[0] for s in stations_enu) + 200
    ymin = min(s[1] for s in stations_enu) - 200
    ymax = max(s[1] for s in stations_enu) + 200
    bounds = (xmin, xmax, ymin, ymax)

    hyperbolas = []
    for i in range(4):
        for j in range(i+1, 4):
            diff = v * (delays[i] - delays[j])
            pts_enu = generate_hyperbola_points(stations_enu[i], stations_enu[j], diff, bounds)

            pts_ll = []
            for x, y in pts_enu:
                lon, lat = to_ll.transform(x, y)
                pts_ll.append({"lat": lat, "lon": lon})

            hyperbolas.append({
                "pair": [i, j],
                "points": pts_ll
            })

    return {
        "station_coords": [{"lat": lat, "lon": lon} for lat, lon in zip(lats, lons)],
        "origin_solution": {"lat": sol_lat, "lon": sol_lon},
        "hyperbolas": hyperbolas
    }

# ------------------------------------------------------------
# If run from CLI
# ------------------------------------------------------------
if __name__ == "__main__":
    args = list(map(float, sys.argv[1:]))
    if len(args) != 12:
        print(json.dumps({"error": "Expected 12 arguments: lat1 lon1 ... lat4 lon4 tA tB tC tD"}))
        sys.exit(1)

    lats = args[0::3][:4]  # lat1, lat2, lat3, lat4
    lons = args[1::3][:4]  # lon1, lon2, lon3, lon4
    tvals = args[2::3][:4] # tA, tB, tC, tD

    result = solve_tdoa(lats, lons, tvals)
    print(json.dumps(result))

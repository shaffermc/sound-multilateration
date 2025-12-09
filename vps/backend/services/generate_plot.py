import sys
import json
import numpy as np
from scipy.optimize import least_squares
from pyproj import Proj, Transformer
import math

v = 343.0   # speed of sound (m/s)

# ------------------------------------------------------------
# Create ENU projection
# ------------------------------------------------------------
def make_enu(lat0, lon0):
    proj_ll = Proj("epsg:4326")
    proj_enu = Proj(f"+proj=tmerc +lat_0={lat0} +lon_0={lon0} +k=1 +units=m +no_defs")
    to_enu = Transformer.from_proj(proj_ll, proj_enu, always_xy=True)
    to_ll = Transformer.from_proj(proj_enu, proj_ll, always_xy=True)
    return to_enu, to_ll


# ------------------------------------------------------------
# TDOA Residuals
# ------------------------------------------------------------
def tdoa_residuals_global(pos, stations, delays):
    res = []
    for i in range(len(stations)):
        for j in range(i + 1, len(stations)):
            Di = np.linalg.norm(pos - stations[i])
            Dj = np.linalg.norm(pos - stations[j])
            res.append((Di - Dj) - v * (delays[i] - delays[j]))
    return res


# ------------------------------------------------------------
# Hyperbola Point Generator
# ------------------------------------------------------------
def generate_hyperbola_points(Si, Sj, diff_meters, bounds, num=200):
    (xmin, xmax, ymin, ymax) = bounds
    xs = np.linspace(xmin, xmax, num)
    pts = []

    def f(x, y):
        Di = np.linalg.norm([x - Si[0], y - Si[1]])
        Dj = np.linalg.norm([x - Sj[0], y - Sj[1]])
        return (Di - Dj) - diff_meters

    for x in xs:
        ys = np.linspace(ymin, ymax, 400)
        vals = [f(x, y) for y in ys]

        for k in range(len(vals) - 1):
            if vals[k] == 0 or vals[k] * vals[k + 1] < 0:
                y0, y1 = ys[k], ys[k + 1]
                for _ in range(20):  # refine with bisection
                    ym = (y0 + y1) / 2
                    if f(x, y0) * f(x, ym) <= 0:
                        y1 = ym
                    else:
                        y0 = ym
                pts.append((x, (y0 + y1) / 2))
                break

    return pts


# ------------------------------------------------------------
# MAIN (CLI MODE)
# ------------------------------------------------------------
if __name__ == "__main__":
    # Expect 12 args
    if len(sys.argv) != 13:
        print(json.dumps({"error": "Expected 12 arguments"}))
        sys.exit(1)

    # Parse args
    lats = [float(sys.argv[i]) for i in [1,3,5,7]]
    lons = [float(sys.argv[i]) for i in [2,4,6,8]]
    delays = np.array([float(sys.argv[i]) for i in [9,10,11,12]])
    delays = delays - delays[0]

    # Reference
    lat0, lon0 = lats[0], lons[0]
    to_enu, to_ll = make_enu(lat0, lon0)

    # Convert stations to ENU
    stations_enu = []
    for lat, lon in zip(lats, lons):
        x, y = to_enu.transform(lon, lat)
        stations_enu.append(np.array([x, y]))
    stations_enu = np.array(stations_enu)

    # Global solution
    guess = np.mean(stations_enu, axis=0)
    sol_enu = least_squares(tdoa_residuals_global, guess, args=(stations_enu, delays)).x

    sol_lon, sol_lat = to_ll.transform(sol_enu[0], sol_enu[1])

    # Bounds for hyperbola generation
    xmin = min(s[0] for s in stations_enu) - 200
    xmax = max(s[0] for s in stations_enu) + 200
    ymin = min(s[1] for s in stations_enu) - 200
    ymax = max(s[1] for s in stations_enu) + 200
    bounds = (xmin, xmax, ymin, ymax)

    # Generate hyperbolas
    hyperbolas = []
    for i in range(4):
        for j in range(i + 1, 4):
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

    # Output JSON for Node.js
    result = {
        "stations": [{"lat": a, "lon": b} for a, b in zip(lats, lons)],
        "origin_solution": {"lat": sol_lat, "lon": sol_lon},
        "hyperbolas": hyperbolas
    }

    print(json.dumps(result))

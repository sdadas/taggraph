import json
import sys
import colorsys

def minify(filename):
    with open(filename, 'r', encoding='utf-8') as infile, open('data.json', 'w', encoding='utf-8') as outfile:
        obj = json.load(infile)
        minify_nodes(obj)
        minify_edges(obj)
        json.dump(obj, outfile)

def minify_nodes(obj):
    nodes = obj['nodes']
    for node in nodes:
        del node['attributes']
        round_fields(node, 'x', 'y', 'size')
        rgb_to_hex(node, 'color')

def minify_edges(obj):
    edges = obj['edges']
    id = 1
    for edge in edges:
        del edge['attributes']
        round_fields(edge, 'size')
        change_lightness(edge, 'color', 0.1)
        mix_color(edge, 'color', (19,28,31))
        rgb_to_hex(edge, 'color')
        edge['id'] = str(id)
        id += 1

def round_fields(obj, *fields):
    for field in fields:
        obj[field] = round(obj[field], 4)

def rgb_to_hex(obj, field):
    obj[field] = '#%02x%02x%02x' % get_rgb(obj, field)

def change_lightness(obj, field, lightness):
    rgb = get_rgb(obj, field)
    rgb = [val / 255.0 for val in rgb]
    hls = list(colorsys.rgb_to_hls(*rgb))
    hls[1] = lightness
    tuple_rgb = tuple(int(val * 255.0) for val in colorsys.hls_to_rgb(*hls))
    obj[field] = 'rgb(%d,%d,%d)' % tuple_rgb

def mix_color(obj, field, mix_with):
    rgb = get_rgb(obj, field)
    tuple_res = tuple((rgb[idx] + mix_with[idx]) / 2.0 for idx in range(3))
    obj[field] = 'rgb(%d,%d,%d)' % tuple_res

def get_rgb(obj, field):
    rgb = obj['color']
    rgb = rgb[4:-1]
    return tuple(int(channel) for channel in rgb.split(','))


if __name__ == '__main__':
    filename = sys.argv[1]
    minify(filename)
// The welcome screen's light. The Innkeep mark is two doorways that overlap,
// one per calendar, darker where they meet. Here they are made of light: a
// coral one and a blue one, drifting slowly towards and away from each other
// in the dark, violet where they cross. `energy` is 1 while the app is
// connecting, and the light breathes faster. Reduce Motion holds it still.
struct Uniforms {
    time: f32,
    resolution: vec2f,
    energy: f32,
}
@group(0) @binding(0) var<uniform> u: Uniforms;

const NIGHT = vec3f(0.043, 0.051, 0.075);
const CORAL = vec3f(1.0, 0.365, 0.451);
const BLUE = vec3f(0.239, 0.427, 0.949);

fn hash(p: vec2f) -> f32 {
    return fract(sin(dot(p, vec2f(127.1, 311.7))) * 43758.5453);
}

fn noise(p: vec2f) -> f32 {
    let i = floor(p);
    let f = fract(p);
    let s = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2f(1.0, 0.0)), s.x),
               mix(hash(i + vec2f(0.0, 1.0)), hash(i + vec2f(1.0, 1.0)), s.x), s.y);
}

// Distance to a doorway: a box of half-width `w` from the floor at -h up to h, a round top above it.
fn doorway(p: vec2f, w: f32, h: f32) -> f32 {
    if (p.y > h) {
        return length(vec2f(p.x, p.y - h)) - w;
    }
    return max(abs(p.x) - w, -(p.y + h));
}

// A doorway's light: full inside, a soft edge, and a glow that reaches well past it.
fn light(d: f32) -> f32 {
    let body = 1.0 - smoothstep(-0.012, 0.012, d);
    let glow = exp(-max(d, 0.0) * 5.5);
    return body * 0.62 + glow * 0.38;
}

@fragment
fn main(@builtin(position) pixel: vec4f) -> @location(0) vec4f {
    // y up, 0 at the middle, one unit the screen's width: the doorways keep their shape on any phone.
    let uv = vec2f(pixel.x - 0.5 * u.resolution.x, 0.5 * u.resolution.y - pixel.y) / u.resolution.x;
    let aspect = u.resolution.y / u.resolution.x;
    let t = u.time;

    // The pair sits in the upper part of the screen, above the words and the form.
    let centre = vec2f(0.0, 0.2 * aspect);
    let drift = 0.028 * sin(t * 0.45);
    let lift = 0.012 * sin(t * 0.31 + 1.3);
    // A slow shimmer inside the light, like heat over a doorstep.
    let wobble = (noise(uv * 3.0 + vec2f(0.0, t * 0.12)) - 0.5) * 0.02;

    let left = uv - centre - vec2f(-0.115 - drift, lift);
    let right = uv - centre - vec2f(0.115 + drift, -lift);
    let a = light(doorway(left + wobble, 0.165, 0.2));
    let b = light(doorway(right - wobble, 0.165, 0.2));

    let breath = 0.88 + 0.12 * sin(t * (0.9 + 2.6 * u.energy));
    var colour = NIGHT;
    colour += CORAL * a * 0.78 * breath;
    colour += BLUE * b * 0.82 * breath;
    // Where both shine, the mark's violet: deeper, not brighter.
    colour = mix(colour, vec3f(0.36, 0.2, 0.86) * breath, clamp(a * b * 1.5, 0.0, 0.85));

    // Light spilling on the floor under the doorways, then the dark the words sit on.
    let floor = exp(-abs(uv.y - centre.y + 0.23) * 9.0) * exp(-abs(uv.x) * 3.0);
    colour += (CORAL + BLUE) * 0.07 * floor;
    let shade = smoothstep(0.05 * aspect, -0.32 * aspect, uv.y);
    colour = mix(colour, NIGHT, shade * 0.86);

    // A little grain keeps the gradients from banding.
    colour += (hash(pixel.xy + fract(t) * 61.0) - 0.5) * 0.022;
    return vec4f(clamp(colour, vec3f(0.0), vec3f(1.0)), 1.0);
}

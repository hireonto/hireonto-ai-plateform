"""Generate professional portrait photos for the HireOnto agents Onric and Tovia.

Uses the Gemini API key from ai/.env (GEMINI_API_KEY). Image models need billing enabled
on that Google AI Studio project; on the free tier the API returns 429 RESOURCE_EXHAUSTED.

Run from the repo root:
    ai/.venv/bin/python scripts/generate-agent-portraits.py

Output:
    website/public/brand/agents/variants/<agent>-<n>.png   all variants
    website/public/brand/agents/<agent>.png                the first variant — the website's
                                                            agent cards switch to it automatically
Swap in a different variant by copying it over <agent>.png.
"""

import pathlib
import shutil
import sys

from google import genai

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'website' / 'public' / 'brand' / 'agents'
VARIANTS = OUT / 'variants'
MODELS = ['gemini-3.1-flash-image', 'gemini-2.5-flash-image', 'gemini-3-pro-image']
TRIES_PER_AGENT = 3

BASE = (
    'Professional corporate studio headshot portrait, photorealistic, {who}, warm genuine confident smile, '
    'looking directly at the camera, chest-up, centered, soft beauty lighting, shallow depth of field, 85mm lens, '
    'smooth soft pink-to-violet gradient studio background, clean modern tech-company look, natural skin texture, '
    'high detail, portrait orientation 3:4, no text, no logo'
)
PEOPLE = {
    'onric': 'a friendly American man in his early 30s, short neat dark-brown hair, light stubble, wearing a tailored '
    'navy blazer over a white open-collar shirt, a small discreet wireless earpiece in his right ear',
    'tovia': 'a friendly American woman in her late 20s, shoulder-length straight light-brown hair, natural makeup, '
    'wearing a black blazer over a black top, a slim modern wireless headset with a small microphone',
}


def api_key() -> str:
    for line in (ROOT / 'ai' / '.env').read_text().splitlines():
        if line.startswith('GEMINI_API_KEY='):
            return line.split('=', 1)[1].strip().strip('"\'')
    sys.exit('GEMINI_API_KEY not found in ai/.env')


def main() -> None:
    client = genai.Client(api_key=api_key())
    VARIANTS.mkdir(parents=True, exist_ok=True)
    for agent, who in PEOPLE.items():
        saved = []
        for model in MODELS:
            try:
                for _ in range(TRIES_PER_AGENT - len(saved)):
                    res = client.models.generate_content(model=model, contents=BASE.format(who=who))
                    for part in res.candidates[0].content.parts:
                        if getattr(part, 'inline_data', None) and part.inline_data.data:
                            path = VARIANTS / f'{agent}-{len(saved) + 1}.png'
                            path.write_bytes(part.inline_data.data)
                            saved.append(path)
                            break
                break
            except Exception as err:  # try the next model
                print(f'{agent}: {model} failed — {str(err)[:160]}')
        if saved:
            shutil.copyfile(saved[0], OUT / f'{agent}.png')
            print(f'{agent}: {len(saved)} variant(s) saved; using {saved[0].name}')
        else:
            print(f'{agent}: no image generated (check billing / quota for this API key)')


if __name__ == '__main__':
    main()

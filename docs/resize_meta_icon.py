from pathlib import Path
from PIL import Image


SOURCE = Path('/home/ubuntu/webdev-static-assets/xdaw-nova-youtube-avatar-under-4mb.png')
TARGET = Path('/home/ubuntu/webdev-static-assets/xdaw-nova-meta-app-icon-512.png')


def main() -> None:
    with Image.open(SOURCE) as image:
        image = image.convert('RGB')
        image.thumbnail((512, 512), Image.Resampling.LANCZOS)
        canvas = Image.new('RGB', (512, 512), (8, 8, 10))
        x = (512 - image.width) // 2
        y = (512 - image.height) // 2
        canvas.paste(image, (x, y))
        canvas.save(TARGET, 'PNG', optimize=True, compress_level=9)

    print(f'created={TARGET}')
    print(f'bytes={TARGET.stat().st_size}')


if __name__ == '__main__':
    main()

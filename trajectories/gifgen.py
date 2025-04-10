import os
from PIL import Image
import re
import cairosvg
import tempfile
import shutil

def natural_sort_key(s):
    """用于自然排序的键函数，确保0.png、1.png、...、10.png等顺序正确"""
    return [int(text) if text.isdigit() else text.lower()
            for text in re.split(r'(\d+)', os.path.splitext(s)[0])]

def create_gif_from_pngs(folder_path, output_path, duration=100):
    """
    从文件夹中的PNG图片创建GIF动画
    
    参数:
        folder_path: 包含PNG图片的文件夹路径
        output_path: 输出GIF文件的路径
        duration: 每帧的持续时间（毫秒）
    """
    # 获取文件夹中所有的PNG文件
    png_files = [f for f in os.listdir(folder_path) if f.endswith('.png')]
    
    # 按自然排序方式对文件名进行排序（0.png, 1.png, 2.png, ..., 10.png, ...）
    png_files.sort(key=natural_sort_key)
    
    if not png_files:
        print("文件夹中没有找到PNG文件！")
        return
    
    print(f"找到 {len(png_files)} 个PNG文件，开始处理...")
    
    # 打开所有图像
    images = []
    for png_file in png_files:
        file_path = os.path.join(folder_path, png_file)
        img = Image.open(file_path)
        images.append(img)
    
    # 保存为GIF
    images[0].save(
        output_path,
        save_all=True,
        append_images=images[1:],
        optimize=False,
        duration=duration,
        loop=0  # 0表示无限循环
    )
    
    print(f"GIF动画已成功创建并保存至: {output_path}")

def diplomacy_sort_key(filename):
    """
    为Diplomacy游戏的阶段文件创建排序键
    格式如: S1901M, F1901M, W1901A, S1902M 等
    """
    # 提取季节 (S=春, F=秋, W=冬)，年份和类型 (M=移动, R=撤退, A=调整)
    match = re.match(r'([SFW])(\d{4})([MRA]|COMPLETED).*', filename)
    
    if not match:
        # 如果是COMPLETED.svg这种特殊文件，放到最后
        if filename == "COMPLETED.svg":
            return (9999, 9999, 'Z')
        return (0, 0, 'A')  # 其他不符合格式的文件放到最前面
    
    season, year, phase = match.groups()
    
    # 季节顺序: S(春) -> F(秋) -> W(冬)
    season_order = {'S': 1, 'F': 2, 'W': 3}
    
    # 阶段顺序: M(移动) -> R(撤退) -> A(调整)
    phase_order = {'M': 1, 'R': 2, 'A': 3, 'COMPLETED': 4}
    
    return (int(year), season_order.get(season, 0), phase_order.get(phase, 0))

def create_gif_from_svgs(folder_path, output_path, duration=500, width=800, temp_dir=None):
    """
    从文件夹中的SVG文件创建GIF动画
    
    参数:
        folder_path: 包含SVG文件的文件夹路径
        output_path: 输出GIF文件的路径
        duration: 每帧的持续时间（毫秒）
        width: 输出图像的宽度（像素），高度将按比例调整
        temp_dir: 临时文件夹路径，用于存储中间PNG文件，如果为None则自动创建
    """
    # 获取文件夹中所有的SVG文件
    svg_files = [f for f in os.listdir(folder_path) if f.endswith('.svg')]
    
    # 按Diplomacy游戏阶段排序文件
    svg_files.sort(key=diplomacy_sort_key)
    
    if not svg_files:
        print("文件夹中没有找到SVG文件！")
        return
    
    print(f"找到 {len(svg_files)} 个SVG文件，按照游戏进程顺序排序:")
    for i, f in enumerate(svg_files):
        print(f"  {i+1}. {f}")
    
    # 创建临时目录存储PNG文件
    created_temp = False
    if temp_dir is None:
        temp_dir = tempfile.mkdtemp()
        created_temp = True
    
    try:
        # 转换SVG到PNG
        png_files = []
        for svg_file in svg_files:
            svg_path = os.path.join(folder_path, svg_file)
            png_file = os.path.join(temp_dir, os.path.splitext(svg_file)[0] + '.png')
            
            # 使用cairosvg将SVG转换为PNG
            cairosvg.svg2png(url=svg_path, write_to=png_file, output_width=width)
            png_files.append(png_file)
        
        # 打开所有转换后的PNG图像
        images = []
        for png_file in png_files:
            img = Image.open(png_file)
            images.append(img)
        
        # 保存为GIF
        if images:
            images[0].save(
                output_path,
                save_all=True,
                append_images=images[1:],
                optimize=False,
                duration=duration,
                loop=0  # 0表示无限循环
            )
            
            print(f"GIF动画已成功创建并保存至: {output_path}")
        else:
            print("没有有效的图像可以转换为GIF")
    
    finally:
        # 清理临时目录
        if created_temp:
            shutil.rmtree(temp_dir)


if __name__ == "__main__":
    # folder = "/home/jianzhu/spinbench.github.io/trajectories/llmllm/ttt/Claude-3.5-Haiku_Llama3.3:70b"
    # folder_path = folder
    # output_path = "ttt.gif"
    # duration = 100
    # create_gif_from_pngs(folder_path, output_path, duration)


    folder_path = "/home/jianzhu/spinbench.github.io/trajectories/diplomacy/no-neg/maps"
    output_path = "diplomacy_game_progress.gif"
    duration = 500  # 1秒/帧
    width = 1200
    create_gif_from_svgs(folder_path, output_path, duration, width)
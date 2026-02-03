import zipfile
import os

def zip_directory(folder_path, output_path):
    with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(folder_path):
            # Exclude hidden directories
            dirs[:] = [d for d in dirs if not d.startswith('.')]
            for file in files:
                if file == 'zipper.py' or file.endswith('.zip'):
                    continue
                file_path = os.path.join(root, file)
                arcname = os.path.relpath(file_path, folder_path)
                zipf.write(file_path, arcname)

if __name__ == "__main__":
    zip_directory('.', 'marvinz_pos.zip')
    print("Zip created successfully.")

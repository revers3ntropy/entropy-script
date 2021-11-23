# Build the NPM package
import os, distutils
from distutils import dir_util
import time
import shutil

start = time.time()

# copy ts src
distutils.dir_util.copy_tree('./src', './npm-package/ts')
# copy es.js
shutil.copyfile('./es.js', './npm-package/es.js')
# minify espm js files
os.system('uglifyjs-folder ./espm -c -e -x .js -o ./npm-package/espm' + ' >/dev/null 2>&1')
# minify build js files
os.system('uglifyjs-folder ./build -c -e -x .js -o ./npm-package/build' + ' >/dev/null 2>&1')


end = time.time()
print('Built in ' + str(round(end-start, 3)) + 's')
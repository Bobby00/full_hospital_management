from setuptools import setup, find_packages

with open('requirements.txt') as f:
	install_requires = f.read().strip().split('\n')

# get version from __version__ variable in gch_queue/__init__.py
from gch_queue import __version__ as version

setup(
	name='gch_queue',
	version=version,
	description='GCH Queue Management',
	author='Karani',
	author_email='info@gerties.org',
	packages=find_packages(),
	zip_safe=False,
	include_package_data=True,
	install_requires=install_requires
)

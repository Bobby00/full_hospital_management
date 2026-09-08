from setuptools import setup, find_packages

with open('requirements.txt') as f:
	install_requires = f.read().strip().split('\n')

# get version from __version__ variable in gch_messaging/__init__.py
from gch_messaging import __version__ as version

setup(
	name='gch_messaging',
	version=version,
	description='App utility to handle all messaging channels within the GCH ERPNext ecosystem',
	author='devs@gerties.org',
	author_email='devs@gerties.org',
	packages=find_packages(),
	zip_safe=False,
	include_package_data=True,
	install_requires=install_requires
)

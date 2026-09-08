from setuptools import setup, find_packages

with open("requirements.txt") as f:
	install_requires = f.read().strip().split("\n")

# get version from __version__ variable in gch_theatre/__init__.py
from gch_theatre import __version__ as version

setup(
	name="gch_theatre",
	version=version,
	description="eGerties Theatre Module",
	author="eGerties Developers",
	author_email="dev@gerties.org",
	packages=find_packages(),
	zip_safe=False,
	include_package_data=True,
	install_requires=install_requires
)

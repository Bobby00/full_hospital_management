from setuptools import setup, find_packages

with open("requirements.txt") as f:
	install_requires = f.read().strip().split("\n")

# get version from __version__ variable in gch_insurance/__init__.py
from gch_insurance import __version__ as version

setup(
	name="gch_insurance",
	version=version,
	description="Adds Insurance integration to egerties",
	author="Thagichu Anthony",
	author_email="athagichu@gerties.org",
	packages=find_packages(),
	zip_safe=False,
	include_package_data=True,
	install_requires=install_requires
)

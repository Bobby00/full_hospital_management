from setuptools import setup, find_packages

with open("requirements.txt") as f:
	install_requires = f.read().strip().split("\n")

# get version from __version__ variable in gch_purchases/__init__.py
from gch_purchases import __version__ as version

setup(
	name="gch_purchases",
	version=version,
	description="This module holds customizations for the purchasing process in the application.",
	author="Levy Riungu",
	author_email="leskeylevy@gmail.com",
	packages=find_packages(),
	zip_safe=False,
	include_package_data=True,
	install_requires=install_requires
)

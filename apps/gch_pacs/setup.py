from setuptools import setup, find_packages

with open("requirements.txt") as f:
	install_requires = f.read().strip().split("\n")

# get version from __version__ variable in gch_pacs/__init__.py
from gch_pacs import __version__ as version

setup(
	name="gch_pacs",
	version=version,
	description="GCH RIS/PACS App",
	author="dev@gerties.org",
	author_email="dev@gerties.org",
	packages=find_packages(),
	zip_safe=False,
	include_package_data=True,
	install_requires=install_requires
)

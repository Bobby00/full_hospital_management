from setuptools import setup, find_packages

with open("requirements.txt") as f:
	install_requires = f.read().strip().split("\n")

# get version from __version__ variable in gch_sentry/__init__.py
from gch_sentry import __version__ as version

setup(
	name="gch_sentry",
	version=version,
	description="eGertie\'s Sentry App",
	author="developers@egerties.org",
	author_email="developers@egerties.org",
	packages=find_packages(),
	zip_safe=False,
	include_package_data=True,
	install_requires=install_requires
)

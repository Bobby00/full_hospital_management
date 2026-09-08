from typing import Any, Dict

from decouple import config 

from functools import wraps
import mysql.connector
from mysql.connector import Error

def login_required(func):
    """Decorator to facilitate connection for DB calls

    Args:
        func (_type_): _description_

    Returns:
        _type_: _description_
    """
    @wraps(func)
    def func_wrapper(self, *args, **kwargs):
        if not self.is_connected:
            self.db_connect()
        return func(self, *args, **kwargs)
    return func_wrapper

def write_file(file_name, data):
    """Write data to file

    Args:
        file_name (_type_): _description_
        data (_type_): _description_

    Returns:
        _type_: _description_
    """
    with open(file_name, 'wb') as file:
        file.write(data)

def convert_to_binary(filename):
    # Convert digital data to binary format
    with open(filename, 'rb') as file:
        binary_data = file.read()
    return binary_data

class SmartUtil:
    """SMART Summary
    1. Definition of Schemes
    2. Data Exchange at Initiation of Patient Bill
    - Member info is read from the card through the SmartLink system.
    - SmartLink system provides a Forward button to post the card details to the Exchange_Table.
    - On pressing the Forward button, the card details are posted to the Exchange_Table as an XML file (ForwardedCardData.xml) to the Smart_File field.
    - 
    3.
    """

    def __init__(self, **kwargs) -> None:
        """
        Initialize the Smart Utility

        """
        self.DB_HOST = config("SMART_DB_HOST", kwargs.get("SMART_DB_HOST"))
        self.DB_PORT = config("SMART_DB_PORT", kwargs.get("SMART_DB_PORT"))
        self.DB_USER = config("SMART_DB_USER", kwargs.get("SMART_DB_USER"))
        self.DB_PASSWORD = config("SMART_DB_PASSWORD", kwargs.get("SMART_DB_PASSWORD"))
        self.DB_NAME = config("SMART_DB_NAME", kwargs.get("SMART_DB_NAME"))
        self.is_connected = False
        self.db_connect()
        super(SmartUtil, self).__init__(**kwargs)

    def db_connect(self) -> Any:
        """Connect to the MySQL database.

        Returns:
            _type_: _description_
        """
        try:
            connection = mysql.connector.connect(
                host=self.DB_HOST,
                database=self.DB_NAME,
                user=self.DB_USER,
                password=self.DB_PASSWORD
            )
            if connection.is_connected():
                self.is_connected = True
                self.connection = connection
                return connection
        except Error as e:
            self.connection = None
            return None
        finally:
            if connection.is_connected():
                connection.close()
                self.connection = None
            return None



    @login_required
    def forward_details(self, patient_info:Dict) -> Any:
        """ 
        1. Connect to remote database
        2. Dump the SQL as blob to smart_file field.

        Args:
            patient_info (Dict): _description_
        """
        payload = f"""

        """
        cursor = self.connection.cursor()
        # Create hospital claims file
        file_to_send = convert_to_binary(None)


        ...

    @login_required
    def read_details(self, patient_data: Dict) -> Any:
        """
        1. Connect to the remote database
        2. Retrieve the forwardedcarddata.xml

        Args:
            patient_data (Dict): _description_
        """
        uhid = patient_data.get("uhid")
        cursor = self.connection.cursor()

        forwarded_card_data_query = cursor.execute(f"""
            SELECT smart_file FROM exchange_table WHERE Member_Nr = %s
        """)

        cursor.execute(forwarded_card_data_query, (uhid,))
        record = cursor.fetchall()
        for row in record:
            forwarded_card_data = row[0]
            write_file("forwarded_card_data.xml", forwarded_card_data)
            # Process the file
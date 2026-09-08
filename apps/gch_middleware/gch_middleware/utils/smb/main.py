# https://github.com/jborean93/smbprotocol

from smb.SMBConnection import SMBConnection
import tempfile
import PyPDF2

import frappe

class GCHSMBClient:
    """GCH SMB Client

    - Facilitates extraction of PDF from LabWare SecureReports SMB share.

    Work In Progress.


            import frappe
        import barcode
        from barcode.writer import ImageWriter


        def on_save(doc, method):
            # create barcode for docname
            barcode_class = barcode.get_barcode_class('code39')
            ean = barcode_class(doc.name, ImageWriter(), add_checksum=False)
            barcode_path = frappe.get_site_path()+'/public/files/'
            ean.save(barcode_path+doc.name+'.png')
            save_image(frappe.get_site_path(),doc.name + '.png')
            img_path = "/files/" + doc.name + ".png"
            frappe.db.sql('''Update `tabSales Order` set barcode_image = %s
                where name = %s''', (img_path, doc.name))
            frappe.db.commit()

        def save_image(path, name):
            # save barcode image to file table
            attach_image = frappe.get_doc({
                "doctype": "File",
                "file_name": name,
                "file_url": path + name,
            })
            attach_image.insert()



    """
    def __init__(self, ip, username, password, servername, share_name):
        self._ip = ip
        self._username = username
        self._password = password
        self._port = 445
        self._share_name = share_name
        self._servername = servername
        self._server = ""
        self._connect()

    def _connect(self):
        """Connect and authenticate to the SMB share."""
        print("Connecting to {}".format(self._ip))
        self._server = SMBConnection(
            username=self._username,
            password=self._password,
            my_name="localhost",
            remote_name=self._servername,
            is_direct_tcp=True,
            use_ntlm_v2=True,
        )
        self._server.connect(self._ip, port=self._port)
        # print(self._server)
        shares = self._server.listShares()
        print(shares)
        for share in shares:
            print(share.name)
            if share.name == self._share_name:

                print("Found share {}".format(share.name))

                # return share
        #     if not share.isSpecial and share.name not in ['NETLOGON', 'SYSVOL']:
        #         print(f"SHARE: {share}")
        #         print("Found share: {}".format(share.name))
        #         sharedfiles = self._server.listPath(share.name, '/')
        #         for sharedfile in sharedfiles:
        #             print(f"SHARED FILE: {sharedfile}")
        #             print(sharedfile.filename)


    def retrieve_file(self, file):
        """Download files from the remote share."""
        print(self._server)
        pdfWriter = PyPDF2.PdfFileWriter()
        root_path = f"{frappe.get_site_path()}/public/files/"
        print(root_path)

        # try:
        #     with tempfile.NamedTemporaryFile(suffix=".pdf") as file_obj:
        #         self._server.retrieveFile(self._share_name, file, file_obj)
        #         # file_obj.write(file_obj.read())
        #         print(type(file_obj))
        #         # file_obj.seek(0)

        #         pdfReader = PyPDF2.PdfFileReader(file_obj)
        #         for pageNum in range(pdfReader.numPages):
        #             pageObj = pdfReader.getPage(pageNum)
        #             pdfWriter.addPage(pageObj)

        #         filename = file.split('/')[-1] if '/' in file else file.split('\\')[-1]
        #         pdfOutput = open(filename, 'wb+')
        #         pdfWriter.write(pdfOutput)
        #         pdfOutput.close() 
        #         print(filename)
        #         # return file_obj.read()
        # except Exception as e:
        #     print(e)
        #     # return None
        # finally:
        #     self._server.close()

        """
         with open(file, "wb+") as file_obj:
            ret = self._server.retrieveFile(service_name=self._share_name, path=file, file_obj=file_obj)
            print(ret)
            file_obj.seek(0)
            print(type(file_obj))
            pdfReader = PyPDF2.PdfFileReader(file_obj)
            for pageNum in range(pdfReader.numPages):
                pageObj = pdfReader.getPage(pageNum)
                pdfWriter.addPage(pageObj)
            # file_obj.seek(0)
            filename = file.split('/')[-1] if '/' in file else file.split('\\')[-1]
            pdfOutput = open(filename+'.pdf', 'wb')
            pdfWriter.write(pdfOutput)
            #Outputting the PDF
            pdfOutput.close() 
        """
       

gch_smb = GCHSMBClient(
    ip="192.168.0.173",
    username="labware",
    password="p@ssw0rd",
    servername="LabWare",
    share_name="SecureReports",
)

if __name__ == "__main__":
    print(gch_smb._server)
    fpath = r"2022\202208\00181157.PDF"
    gch_smb.retrieve_file(fpath)

   
    


    # userID = 'labware'
    # password = 'p@ssw0rd'
    # client_machine_name = 'localpcname'

    # server_name = 'LabWare'
    # server_ip = '192.168.0.173'

    # domain_name = 'ggch-muthaiga.gerties.org'

    # conn = SMBConnection(userID, password, client_machine_name, server_name, domain=domain_name, use_ntlm_v2=True,
    #                     is_direct_tcp=True)

    # conn.connect(server_ip, 445)

    # print(conn)

    # shares = conn.listShares()

    # for share in shares:
        # if not share.isSpecial and share.name not in ['NETLOGON', 'SYSVOL']:
        #     sharedfiles = conn.listPath(share.name, '/')
        #     for sharedfile in sharedfiles:
        #         print(sharedfile.filename)

    # conn.close()
    # # pass
    # smbclient = SMBClient(ip='

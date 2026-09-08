

class GCHIPUtil:
    def __init__(self):
        ...

    def ip_to_binary(self, ip: str) -> str:
        octet_list_int = ip.split(".")
        octet_list_bin = [format(int(i), '08b') for i in octet_list_int]
        binary = ("").join(octet_list_bin)
        return binary

    def get_addr_network(self, address: str, net_size: int) -> str:
        #Convert ip address to 32 bit binary
        ip_bin = self.ip_to_binary(address)
        #Extract Network ID from 32 binary
        network = ip_bin[0:32-(32-net_size)]    
        return network


    def ip_in_prefix(self, ip_address: str, prefix: str) -> bool:
        #CIDR based separation of address and network size
        try:
            [prefix_address, net_size] = prefix.split("/")
        #Convert string to int
            net_size = int(net_size)
        #Get the network ID of both prefix and ip based net size
            prefix_network = self.get_addr_network(prefix_address, net_size)
            ip_network = self.get_addr_network(ip_address, net_size)
        except:
            return ip_address == prefix
        return ip_network == prefix_network


gch_ip_util = GCHIPUtil()
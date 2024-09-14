import re

def lldpNeighborsInitialization(contents, lldp_dict):
    interface_match_list = re.findall('Interface ([\\S]+) detected [^0]', contents)
    neighbor_id_list = re.findall('- System Name: "([\\S]+)"', contents)
    neighbor_port_id_list = re.findall('Port ID     : ([\\S]+)', contents)
    neighbor_mac_address = re.findall('Chassis ID     : ([\\S]+)', contents)
    # print(len(interface_match_list), len(neighbor_id_list), len(neighbor_port_id_list), len(neighbor_mac_address))
    for interface_no in range(0, len(interface_match_list)):
        lldp_dict[interface_match_list[interface_no]] = {'neighbor_id': neighbor_id_list[interface_no], 'neighor_port_id': neighbor_port_id_list[interface_no], 'neighbor_mac': neighbor_mac_address[interface_no]}
    return lldp_dict

def lldpOutput(lldp_dict):
    content = ("%-20s%-40s%-30s%-20s" % ("Port", "Neighbor Device ID", "Neighbor Port ID", "Neighbor System MAC"))
    for interface in lldp_dict:
            content += '\n' + ("%-20s%-40s%-30s%-20s" % (interface, lldp_dict[interface]['neighbor_id'], lldp_dict[interface]['neighor_port_id'].replace('"',''), lldp_dict[interface]['neighbor_mac']))
    return content

def lldpNeighborsDetail(contents, command):
    contents += '\n------------- EndsHere -------------'
    try:
        # getting the interface
        interface = re.findall(r'show lldp neighbors (\w.+) detail', command)
        interface = re.sub(' ', '', interface[0])
        interface = re.sub('Et(h(e(r(n(e(t?)?)?)?)?)?)?', 'Ethernet', interface, flags=re.IGNORECASE)
        interface = re.sub('Ma(n(a(g(e(m(e(n(t?)?)?)?)?)?)?)?)?', 'Management', interface, flags=re.IGNORECASE)
        # matching the interface to get outputs
        first_match = re.search(rf'Interface {interface}.+', contents).span()
        lines_to_start_from = first_match[0]
        first_match = first_match[1]
        second_match = re.search(r'\nInterface.*detected|------------- EndsHere -------------', contents[first_match:]).span()[0]
        lines_to_end_at = second_match + first_match
        actual_output = f'\n------------- show lldp neighbor detail (for interface {interface}) -------------\n\n'
        actual_output += contents[lines_to_start_from:lines_to_end_at]
        return(actual_output)
    except Exception as e:
        return('Interface not present on the device')

def handle_lldp_commands(self, command, match):
    handler_map = {
        'show lldp neighbors (et|ma).* detail': lldpNeighborsDetail,
    }
    for key in handler_map:
        if re.match(fr'{key}.*', command):
            return(handler_map[key](self.command_searcher('show lldp neighbors detail'), command))
import re
import subprocess 
import sys
import os
import gzip
from ..command_modules.routeLookup import *
from ..command_modules.ipv6_routeLookup import *
from ..command_modules.showRunSection import *
from ..command_modules.customCommandMapper import *
from ..command_modules.showLogging import *
from ..command_modules.lldpNeighbors import *
from io import StringIO
from ..command_modules.vlaninfo import *
from ..command_modules.bgpCommands import *
import time

def performance_tracker(function):
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        result = function(*args, **kwargs)
        end = time.perf_counter()
        print(f'{function.__name__} got executed in {end-start}s')
        return result
    return wrapper

class ShowTech:
    def __init__(self, file):
        if os.path.isfile(file):
            file_type = os.path.splitext(file)[1]
            try: 
                if file_type == '.gz':
                    with gzip.open(file) as f:
                        self.file_content = f.read().decode()
                else:
                    with open(file) as f:
                        self.file_content = f.read()
            except gzip.BadGzipFile as e:
                with open(file) as f:
                        self.file_content = f.read()
        else:
            print(f"wrong file provided or file doesn't exist")
            sys.exit()
        self.hostname = 'Switch'
        self.cmd_dictionary = {} # holds all the commands present in the show tech as a heirarchy 
        self.allCommands = [] # holds all the commands present in the show tech
        self.routes = {} # holds all vrf routes 
        self.lldp_dictionary = {} # holds lldp information
        self.banner = '' # banner to hold user_typed_commands from the frontend
        try:
            lldpNeighborsInitialization(self.command_searcher('show lldp neighbors detail'), self.lldp_dictionary)
        except IndexError as e:
            # print('"show lldp neighbors" is not accurate. Please use "show lldp neighbors detail" for proper info.')
            pass
    
    # gathers all commands and stores in a list, which is used later in autocomplete and when user presses ?
    def gather_commands(self):
        # commands that take in custom keyword
        placeHolderCommands = [ # show run section part
                               r'show running-config section *<search> regex .*',\
                               r'show running-config section *<search> branches',\
                                # show run interfaces part 
                               r'show running-config interfaces ethernet *<number> regex ^[0-9/]+(\.[0-9]+)?$',\
                               r'show running-config interfaces ethernet *<number> branches',\
                               r'show running-config interfaces loopback *<number> regex ^[0-9]+(\.[0-9]+)?$',\
                               r'show running-config interfaces loopback *<number> branches',\
                               r'show running-config interfaces vlan *<number> regex ^[0-9/]+$',\
                               r'show running-config interfaces vlan *<number> branches',\
                               r'show running-config interfaces *<et-interface> regex ^(?:ethernet|etherne|ethern|ether|ethe|eth|et)?[0-9/]+(\.[0-9]+)?$(?:/[0-9/]+(\.[0-9]+)?$)*$',\
                               r'show running-config interfaces *<et-interface> branches',\
                               r'show running-config interfaces port-channel *<number> regex ^[0-9/]+(\.[0-9]+)?$',\
                               r'show running-config interfaces port-channel *<number> branches',\
                               r'show running-config interfaces *<po-interface> regex ^(?:port-channel|port-channe|port-chann|port-chan|port-cha|port-ch|port-c|port|por|po)?[0-9/]+(\.[0-9]+)?$(?:/[0-9/]+(\.[0-9]+)?$)*$',\
                               r'show running-config interfaces *<po-interface> branches',\
                               r'show running-config interfaces *<lo-interface> regex ^(?:loopback|loopbac|loopba|loopb|loop|loo|lo)?[0-9]+(?:/[0-9]+)*$',\
                               r'show running-config interfaces *<lo-interface> branches',\
                               r'show running-config interfaces *<vl-number> regex ^(?:vlan|vla|vl)?[0-9]+(?:/[0-9]+)*$',\
                               r'show running-config interfaces *<vl-number> branches',\
                               r'show running-config interfaces management *<number> regex ^[0-9/]+$',\
                               r'show running-config interfaces management *<number> branches',\
                               r'show running-config interfaces *<ma-interface> regex ^(?:management|managemen|manageme|managem|manage|manag|mana|man|ma)?[0-9/]+(?:/[0-9]+)*$',\
                               r'show running-config interfaces *<ma-interface> branches',\
                                # show logging x part
                               r'show logging *<lines> regex \d+',\
                               r'show logging *<lines> branches',\
                                # show vlan no part
                               r'show vlan *<number> regex \d+',\
                               r'show vlan *<number> branches',\
                                # show arp vrf part
                               r'show arp vrf *<WORD> regex .*',\
                               r'show arp vrf *<WORD> branches',\
                                # show interfaces x part
                               r'show interfaces ethernet *<number> regex ^[0-9/]+(\.[0-9]+)?$',\
                               r'show interfaces ethernet *<number> branches',\
                               r'show interfaces ethernet *<number> branches mac detail',\
                               r'show interfaces ethernet *<number> branches phy detail',\
                               r'show interfaces ethernet *<number> branches status',\
                               r'show interfaces *<et-interface> regex ^(?:ethernet|etherne|ethern|ether|ethe|eth|et)?[0-9/]+(\.[0-9]+)?$(?:/[0-9/]+(\.[0-9]+)?$)*$',\
                               r'show interfaces *<et-interface> branches',\
                               r'show interfaces *<et-interface> branches mac detail',\
                               r'show interfaces *<et-interface> branches phy detail',\
                               r'show interfaces *<et-interface> branches status',\
                               r'show interfaces port-channel *<number> regex ^[0-9/]+(\.[0-9]+)?$',\
                               r'show interfaces port-channel  *<number> branches',\
                               r'show interfaces port-channel  *<number> branches status',\
                               r'show interfaces *<po-interface> regex ^(?:port-channel|port-channe|port-chann|port-chan|port-cha|port-ch|port-c|port|por|po)?[0-9/]+(\.[0-9]+)?$(?:/[0-9/]+(\.[0-9]+)?$)*$',\
                               r'show interfaces *<po-interface> branches',\
                               r'show interfaces *<po-interface> branches status',\
                               r'show interfaces loopback *<number> regex ^[0-9/]+$',\
                               r'show interfaces loopback *<number> branches',\
                               r'show interfaces *<lo-interface> regex ^(?:loopback|loopbac|loopba|loopb|loop|loo|lo)?[0-9]+(?:/[0-9]+)*$',\
                               r'show interfaces *<lo-interface> branches',\
                               r'show interfaces vlan *<number> regex ^[0-9/]+$',\
                               r'show interfaces vlan *<number> branches',\
                               r'show interfaces *<vl-number> regex ^(?:vlan|vla|vl)?[0-9]+(?:/[0-9]+)*$',\
                               r'show interfaces *<vl-number> branches',\
                               r'show interfaces management *<number> regex ^[0-9/]+$',\
                               r'show interfaces management *<number> branches',\
                               r'show interfaces management *<number> branches status',\
                               r'show interfaces *<ma-interface> regex ^(?:management|managemen|manageme|managem|manage|manag|mana|man|ma)?[0-9/]+(?:/[0-9/]+)*$',\
                               r'show interfaces *<ma-interface> branches',\
                               r'show interfaces *<ma-interface> branches status',\
                                # show ip route x.x.x.x part
                               r'show ip route *<A.B.C.D> regex ^(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9]).(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9]).(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9]).(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])$',\
                               r'show ip route *<A.B.C.D> branches',\
                               r'show ip route vrf *<WORD> regex .*',\
                               r'show ip route vrf *<WORD> branches *<A.B.C.D> regex ^(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9]).(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9]).(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9]).(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])$',\
                               r'show ip route vrf *<WORD> branches *<A.B.C.D> branches',\
                               r'show ip route vrf *<WORD> branches detail',\
                               r'show ip route vrf *<WORD> branches host',\
                               r'show ip route vrf *<WORD> branches summary',\
                               r'show ipv6 route *<A:B:C:D:E:F:G:H> regex ^([0-9a-fA-F]{1,4}:){7}([0-9a-fA-F]{1,4}|:)$|^(::([0-9a-fA-F]{1,4}:){0,6}[0-9a-fA-F]{1,4})$|^([0-9a-fA-F]{1,4}::([0-9a-fA-F]{1,4}:){0,5}[0-9a-fA-F]{1,4})$|^(([0-9a-fA-F]{1,4}:){1,6}:).*$',\
                               r'show ipv6 route *<A:B:C:D:E:F:G:H> branches',\
                               r'show ipv6 route vrf *<WORD> regex .*',\
                               r'show ipv6 route vrf *<WORD> branches *<A:B:C:D:E:F:G:H> regex ^([0-9a-fA-F]{1,4}:){7}([0-9a-fA-F]{1,4}|:)$|^(::([0-9a-fA-F]{1,4}:){0,6}[0-9a-fA-F]{1,4})$|^([0-9a-fA-F]{1,4}::([0-9a-fA-F]{1,4}:){0,5}[0-9a-fA-F]{1,4})$|^(([0-9a-fA-F]{1,4}:){1,6}:).*$',\
                               r'show ipv6 route vrf *<WORD> branches *<A:B:C:D:E:F:G:H> branches',\
                               r'show ipv6 route vrf *<WORD> branches detail',\
                               r'show ipv6 route vrf *<WORD> branches host',\
                               r'show ipv6 route vrf *<WORD> branches summary',\
                                # show ip bgp neighbor part
                               r'show ip bgp neighbor *<A.B.C.D> regex \d+\.\d+\.\d+\.\d+',\
                               r'show ip bgp neighbor *<A.B.C.D> branches',\
                               r'show ip bgp neighbor *<A.B.C.D> branches vrf *<WORD> regex .*',\
                               r'show ip bgp neighbor *<A.B.C.D> branches vrf *<WORD> branches',\
                               r'show ip bgp neighbor vrf *<WORD> regex .*',\
                               r'show ip bgp neighbor vrf *<WORD> branches',\
                                # show ip bgp summary part 
                               r'show ip bgp summary vrf *<WORD> regex .*',\
                               r'show ip bgp summary vrf *<WORD> branches'\
                               r'show ipv6 bgp summary vrf *<WORD> regex .*',\
                               r'show ipv6 bgp summary vrf *<WORD> branches',\
                                # show lldp neighbors et/ma part
                               r'show lldp neighbors ethernet *<number> regex ^[0-9/]+(\.[0-9]+)?$',\
                               r'show lldp neighbors ethernet *<number> branches detail',\
                               r'show lldp neighbors management *<number> regex ^[0-9/]+((\.)?[0-9]+)?$',\
                               r'show lldp neighbors management *<number> branches detail',\
                               r'show lldp neighbors *<et-interface> regex ^(?:ethernet|etherne|ethern|ether|ethe|eth|et)?[0-9/]+(\.[0-9]+)?$(?:/[0-9/]+(\.[0-9]+)?$)*$',\
                               r'show lldp neighbors *<et-interface> branches detail',\
                               r'show lldp neighbors *<ma-interface> regex ^(?:management|managemen|manageme|managem|manage|manag|mana|man|ma)?[0-9/]+(?:/[0-9/]+)*$',\
                               r'show lldp neighbors *<ma-interface> branches detail',                                       
                            ]
                # static custom commands
        customCommands = ['show ip interface brief']
        self.allCommands = re.findall('------------- (show.*|bash.*) -------------', self.file_content)
        try:
            # removing a certain set of commands from allCommands to reomve discrepancies. For instance 'all' can be considered a placeholder value after vrf hence we can remove them
            for cmd in ['show ip route vrf all detail', 'show ip route vrf all host', 'show ip route vrf all summary', 'show ipv6 route vrf all detail', 'show ipv6 route vrf all host', 'show ipv6 route vrf all summary', 'show ip bgp summary vrf all', 'show ipv6 bgp summary vrf all']:
                self.allCommands.remove(cmd)
        except Exception as e:
            pass
        # adding both placeholder and custom commands to the allCommands list that hold all the show commands that could be executed
        self.allCommands.extend(placeHolderCommands)
        self.allCommands.extend(customCommands)
        # adding carriage return to the end of all show commands
        self.newallCommands = [item + ' <cr>' for item in self.allCommands if item.startswith('show')] 
        self.newallCommands += [item for item in self.allCommands if item.startswith('bash')]
        try:
            # allCommnands is useful for the UI to do command checks before sending it to the backend(1). We need to remove keywords like regex and branches so that it does not show up when user does '?'
            self.actualCommands = [ re.sub(r'\s*branches', '', item) for item in [item for item in self.allCommands if item not in re.findall(r'.*regex.*', '\n'.join(self.allCommands))] ]
        except Exception as e:
            print('Issue while creating actual commands, setting it to allCommands for now')
            self.actualCommands = self.newallCommands
        # cmd dictionary which is useful for autocomplete is built using the allCommands list(2)
        for cmd in self.newallCommands:
            parts = cmd.split() # splitting the commands => parts = ['show version detail', 'show interfaces status', ..]
            temp_dict = self.cmd_dictionary # using a temporary dictionay used later in the iteration. For each command iteration, temp_dict now points to the original cmd_dictionary
            for part in parts: # splitting the commmands itself => ['show' 'version', 'detail'] to check if element exists in dictionary. If not, then populates it
                if part not in temp_dict: 
                    temp_dict[part] = {}
                temp_dict = temp_dict[part] # now temp dict point to the empty dictionary of the key {part}. Eg cmd_dictionry = {show: {} <-- temp_dict}
        # gathering all the commands in the showtech that have nz suffix
        self.nz_commands = [item.replace(' | nz', '') for item in self.allCommands if '| nz' in item]
        # # mod_cmds = [re.sub(r'interfaces all', 'interfaces', item) for item in self.allCommands]
        # # # self.newallCommands = mod_cmds

    def show_tech_commands_modifier(self):
        # function to modify the commands in the show tech for easier parsing
        self.file_content = re.sub(r'------------- show interface ', '------------- show interfaces ', self.file_content, flags=re.MULTILINE)
        self.file_content = re.sub(r'------------- show interfaces vxlan .* -------------', '------------- show interfaces vxlan1 -------------', self.file_content, flags=re.MULTILINE)
        self.file_content = re.sub(r'------------- show running-config sanitized -------------', '------------- show running-config -------------', self.file_content, flags=re.MULTILINE)

    def user_commands_modifier(self, command):
        command_1 = re.sub(r'mac\s+detail', 'mac-detail', command) 
        command_2 = re.sub(r'phy\s+detail', 'phy-detail', command_1)
        return command_2
    
    def user_bash_commands_modifier(self, bash_command):
        # if pb command exists in bash commands, replacing the alias with the actual command
        command = re.sub(r'(\|\s*)?\bpb\b', 'curl -sF c=@- pb.infra.corp.arista.io', bash_command)
        return command

    def get_pb_link(self, contents):
        cmd_to_run = r'curl -sF c=@- pb.infra.corp.arista.io'
        command_prior_pipe = contents.encode()
        result = subprocess.run(cmd_to_run, shell=True, input=command_prior_pipe, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        bash_output = result.stdout.decode()
        bash_err = result.stderr.decode()
        if bash_err:
            return(bash_err)
        else:
            return(bash_output)

    def command_searcher(self, command):
        pattern = fr'------------- {command} -------------'
        first_match = re.search(pattern, self.file_content)
        # if there's any match for the command
        if first_match:
            next_pattern = r'------------- (show|bash).*'
            second_match = re.search(next_pattern, self.file_content[first_match.end():])
            if second_match:
                output = self.file_content[first_match.start():(first_match.end() + second_match.start() - 1)]
                return output
            else:
                output = self.file_content[first_match.start():]
                return output
        else:
            return ('wrong or incomplete command')
 
    # gets the hostname and gets it assigend to a variable
    def get_hostname(self):
        for line in self.command_searcher('show running-config').splitlines():
            searches = re.search(r'^hostname\s+(.+)$', line)
            if searches:
                self.hostname = searches.group(1)
                break
    
    @performance_tracker
    # parses the routing table and returns a dictionary of vrf routes
    def routing_logic(self):
        # for ipv4
        # Route loookup Logic. Parsing the whole route output as follows vrf_routing_table = (vrf-default: {10.0.0.0/24: {binary-eq: 00001010.00000000.00000000.00000000, prefix: 24}})
        self.routing_contents = self.command_searcher('show ip route vrf all detail') # has the ouput of the command show ip route vrf all detail
        self.routing_contents += '\nVRF: Table_Ends_Here' # this line has been added for a regex match used when user inputs the last avaialble vrf on the device
        self.vrf_routing_table = {}
        self.matched_routes = [] # holds the matched ip's in a specifif vrf for an ip inputted by the user
        parsing_routing_table(self.routing_contents, self.routes)
        for vrf in self.routes:  
            self.vrf_routing_table[vrf] = creating_vrf_routing_table(self.routes[vrf])
        # for ipv6 
        self.ipv6_routing_contents = self.command_searcher('show ipv6 route vrf all detail')
        self.ipv6_routing_contents += '\nVRF: Table_Ends_Here' 
        self.ipv6_vrf_routing_table = (creating_ipv6_vrf_routing_table(ipv6_route_parsing(self.ipv6_routing_contents)))

    # checks the user entered command against the condition and returns the output
    def command_processor(self, command):
        command = self.user_commands_modifier(command)
        # Handle custom dynamic commands
        command_handlers = {
            r"show ip route( vrf (\w+))?( ([\d.]+))?": handle_ip_route,  # Combine patterns for efficiency 
            r"show ipv6 route( vrf (\w+))?( ([\d.]+))?": handle_ipv6_route,  # Combine patterns for efficiency 
            r"show logging (\d+)": handle_show_logging,
            r"show running-config section": shrunsec,
            r"show running-config interfaces": shrunint,
            r"show interfaces(\s)((Et|Po|Vx|Ma)(.*)\s)?(status|switchport|mac-detail|phy-detail)": handle_show_interfaces_options, # more info on regex here: https://regex101.com/r/rPk0ov/1
            r"show interfaces(\s)?((et|po|vl|ma|lo)(.*[0-9]))?$": handle_individual_interfaces, # more info on regex here: https://regex101.com/r/LAY345/1
            r"show vlan \d+": handle_per_vlan,
            r"show ip(v(6)?)? bgp\s*\S*": handle_bgp_commands,
            r"show lldp neighbors (et|ma).* detail$": handle_lldp_commands,
        }

        for pattern, handler in command_handlers.items():
            match = re.search(pattern, command, flags=re.IGNORECASE)
            if match:
                return handler(self, command=command, match=match) 

        # Handle static commands mapped in mapCommand 
        if command in mapCommand:
            return handle_mapped_command(self, command)
        
        # Handle nz commands
        for cmd in self.nz_commands:
            if cmd == command:
               print("Showing only non-zero values for this command")
               command = fr"{command} \| nz"
               return self.command_searcher(command)
        
        # Handle unmatched commands
        return self.command_searcher(command)

    @performance_tracker
    def command_handler(self, command):
        switch_command = ''
        bash_command = ''
        command = re.sub(r' +', ' ', command) # removing white spaces between words if any
        try:
            # if any bash commmand provided
            switch_command, bash_command = command.split('|', maxsplit=1)
            switch_command = switch_command.rstrip()
        except ValueError as e:
            switch_command = command
        bash_err = None
        bash_output = ''
        if bash_command:
            command_prior_pipe = self.command_processor(switch_command)
            command_prior_pipe += '\n'
            command_prior_pipe = re.sub(r'(\n)+$', '\n', command_prior_pipe)
            input_data = command_prior_pipe.encode()
            pre_pb_command = None
            post_pb_command = None
            # in case if pb command is used, populuating a few variables
            if re.search(r'(\|)?\s*\bpb\b.*', bash_command): # searches for | pb | bla bla bla or pb | bla bla bla or bla bla bla | pb
                pre_pb_command = re.sub(r'(\|)?\s*\bpb\b.*', '', bash_command)
                post_pb_command = re.search(r'(\|)?\s*\bpb\b.*', bash_command).group()
            # if no pb command is present and only normal bash commands
            if not pre_pb_command and not post_pb_command:
                result = subprocess.run(bash_command, shell=True, input=input_data, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
                bash_output = result.stdout.decode()
                bash_err = result.stderr.decode()
                # print(f'bash error {bash_err}')
            # if only pb command is present and no bash commands prior to it
            elif not pre_pb_command and post_pb_command: 
                bash_output = command_prior_pipe
            # if pb commands is preset but along with a few other bash commands prior to it
            elif pre_pb_command and post_pb_command:
                result = subprocess.run(pre_pb_command, shell=True, input=input_data, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
                bash_output = result.stdout.decode()
                bash_err = result.stderr.decode()
            # once the bash outputs/errors are populualed, we move on to the next conditional phase
            # if pb command exists
            if post_pb_command:
                #changing the pb alias to the actual command
                post_pb_command = self.user_bash_commands_modifier(post_pb_command)
                # adding starter and footer to the outputs
                new_banner = re.sub(r'(\s*)\|(\s*)pb.*', '', self.banner)
                # starter = f"-_-_-_-_-_-_- sherlog output for '{new_banner}' _-_-_-_-_-_-_ \n\n"
                footer = f"-_-_-_-_-_-_- this output was taken from sherlog for ' {new_banner} ' _-_-_-_-_-_-_"
                if bash_err:
                    print('Issue in running bash commands')
                    return(bash_err)
                else:
                    print('bash/cli commands were successful and now runnning pb')
                    # new_ouput = starter + bash_output + footer
                    corrected_output = re.sub(r'(\n)+$', '\n', bash_output)
                    # print(corrected_output)
                    new_ouput = corrected_output + footer
                    result = subprocess.run(post_pb_command, shell=True, input=new_ouput.encode(), stdout=subprocess.PIPE, stderr=subprocess.PIPE)
                    return result.stdout.decode()
            else:
                # when its just a bash command
                if bash_err:
                    return(bash_err)
                else:
                    return(f'\n{bash_output}')
        else:
            return(self.command_processor(switch_command))
    
    def glance(self):
        serial_number = self.command_handler("show version | grep -i serial | awk '{print $3}'").replace('\n', '')
        if serial_number is None or serial_number == "":
            serial_number = 'zzz999999' 
        time_stamp = self.command_handler("show clock | grep '.*:.*:.*'").replace('\n', '')
        if time_stamp is None or time_stamp == "":
            time_stamp = 'no time to die'
        return {'hostname': self.hostname, 'serialNumber': serial_number, 'timeStamp': time_stamp}
import npi from '../assets/teams/npi.jpeg'
import ambato_city from '../assets/teams/ambato_city.png'
import canutos from '../assets/teams/canutos.PNG'
import cbi from '../assets/teams/CBI.jpeg'
import cotopaxi_elite from '../assets/teams/cotopaxi_elite.jpeg'
import drackar from '../assets/teams/drackar.jpeg'
import fenix_bc from '../assets/teams/fenix_bc.jpeg'
import golden_kings from '../assets/teams/golden_kings.jpeg'
import juanchos from '../assets/teams/juanchos.png'
import dm_basketball from '../assets/teams/OM_basketball.PNG'
import team_ramoncinos from '../assets/teams/team_ramoncinos.jpeg'
import team_salcedo from '../assets/teams/team_salcedo.png'
import tnt from '../assets/teams/tnt.png'

const logoMap = {
  'npi': npi,
  'ambato city': ambato_city,
  'canutos': canutos,
  'club independiente': cbi,
  'cotopaxi elite': cotopaxi_elite,
  'drackar': drackar,
  'fenix bc': fenix_bc,
  'fénix bc': fenix_bc,
  'golden kings': golden_kings,
  'juanchos': juanchos,
  'dm basketball': dm_basketball,
  'om basketball': dm_basketball,
  'team ramoncinos': team_ramoncinos,
  'team salcedo': team_salcedo,
  'team tnt': tnt,
  'tnt': tnt,
}

export function getTeamLogo(teamName) {
  if (!teamName) return null
  return logoMap[teamName.toLowerCase().trim()] || null
}

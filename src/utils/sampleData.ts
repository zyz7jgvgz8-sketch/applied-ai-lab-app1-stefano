export const SAMPLE_SALES_CSV = `quarter,region,channel,product,units,discount_pct,revenue
Q1,North America,Direct Enterprise,Enterprise Cloud,140,8.5,420000
Q1,North America,Reseller Network,Hardware Terminal,320,12.0,288000
Q1,North America,Online Portal,Analytics Studio,550,5.0,165000
Q1,North America,System Integrators,CyberShield Pro,95,10.0,237500
Q1,EMEA,Direct Enterprise,Enterprise Cloud,110,9.0,330000
Q1,EMEA,Reseller Network,Hardware Terminal,260,14.0,223600
Q1,EMEA,Online Portal,Analytics Studio,380,6.0,114000
Q1,EMEA,System Integrators,CyberShield Pro,70,11.0,175000
Q1,APAC,Direct Enterprise,Enterprise Cloud,85,10.0,255000
Q1,APAC,Reseller Network,Hardware Terminal,410,15.0,348500
Q1,APAC,Online Portal,Analytics Studio,290,7.5,87000
Q1,APAC,System Integrators,CyberShield Pro,60,12.0,150000
Q1,LATAM,Direct Enterprise,Enterprise Cloud,45,12.0,135000
Q1,LATAM,Reseller Network,Hardware Terminal,180,18.0,147600
Q1,LATAM,Online Portal,Analytics Studio,190,8.0,57000
Q1,LATAM,System Integrators,CyberShield Pro,35,15.0,87500
Q2,North America,Direct Enterprise,Enterprise Cloud,165,7.5,495000
Q2,North America,Reseller Network,Hardware Terminal,310,11.5,279000
Q2,North America,Online Portal,Analytics Studio,610,5.0,183000
Q2,North America,System Integrators,CyberShield Pro,110,9.5,275000
Q2,EMEA,Direct Enterprise,Enterprise Cloud,125,8.0,375000
Q2,EMEA,Reseller Network,Hardware Terminal,240,13.5,206400
Q2,EMEA,Online Portal,Analytics Studio,420,5.5,126000
Q2,EMEA,System Integrators,CyberShield Pro,75,10.5,187500
Q2,APAC,Direct Enterprise,Enterprise Cloud,90,9.5,270000
Q2,APAC,Reseller Network,Hardware Terminal,440,14.0,378400
Q2,APAC,Online Portal,Analytics Studio,310,7.0,93000
Q2,APAC,System Integrators,CyberShield Pro,65,11.0,162500
Q2,LATAM,Direct Enterprise,Enterprise Cloud,50,11.0,150000
Q2,LATAM,Reseller Network,Hardware Terminal,195,17.0,159900
Q2,LATAM,Online Portal,Analytics Studio,210,7.5,63000
Q2,LATAM,System Integrators,CyberShield Pro,40,14.0,100000
Q3,North America,Direct Enterprise,Enterprise Cloud,175,7.0,525000
Q3,North America,Reseller Network,Hardware Terminal,295,12.0,265500
Q3,North America,Online Portal,Analytics Studio,640,4.5,192000
Q3,North America,System Integrators,CyberShield Pro,118,9.0,295000
Q3,EMEA,Direct Enterprise,Enterprise Cloud,230,6.0,690000
Q3,EMEA,Reseller Network,Hardware Terminal,290,11.0,249400
Q3,EMEA,Online Portal,Analytics Studio,560,4.0,168000
Q3,EMEA,System Integrators,CyberShield Pro,125,8.5,312500
Q3,APAC,Direct Enterprise,Enterprise Cloud,70,11.0,210000
Q3,APAC,Reseller Network,Hardware Terminal,280,18.0,240800
Q3,APAC,Online Portal,Analytics Studio,260,8.5,78000
Q3,APAC,System Integrators,CyberShield Pro,50,13.0,125000
Q3,LATAM,Direct Enterprise,Enterprise Cloud,55,10.5,165000
Q3,LATAM,Reseller Network,Hardware Terminal,205,16.5,168100
Q3,LATAM,Online Portal,Analytics Studio,230,7.0,69000
Q3,LATAM,System Integrators,CyberShield Pro,42,13.5,105000
Q4,North America,Direct Enterprise,Enterprise Cloud,195,6.5,585000
Q4,North America,Reseller Network,Hardware Terminal,340,11.0,306000
Q4,North America,Online Portal,Analytics Studio,710,4.0,213000
Q4,North America,System Integrators,CyberShield Pro,130,8.5,325000
Q4,EMEA,Direct Enterprise,Enterprise Cloud,250,5.5,750000
Q4,EMEA,Reseller Network,Hardware Terminal,310,10.5,266600
Q4,EMEA,Online Portal,Analytics Studio,620,4.0,186000
Q4,EMEA,System Integrators,CyberShield Pro,140,8.0,350000
Q4,APAC,Direct Enterprise,Enterprise Cloud,100,10.0,300000
Q4,APAC,Reseller Network,Hardware Terminal,360,15.0,309600
Q4,APAC,Online Portal,Analytics Studio,330,7.0,99000
Q4,APAC,System Integrators,CyberShield Pro,75,11.5,187500
Q4,LATAM,Direct Enterprise,Enterprise Cloud,65,10.0,195000
Q4,LATAM,Reseller Network,Hardware Terminal,225,16.0,184500
Q4,LATAM,Online Portal,Analytics Studio,255,6.5,76500
Q4,LATAM,System Integrators,CyberShield Pro,48,13.0,120000`;

export function downloadSampleCsvFile() {
  const blob = new Blob([SAMPLE_SALES_CSV], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'sales_orders_sample.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

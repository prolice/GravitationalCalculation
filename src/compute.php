<?php
declare(strict_types=1);

$errors = []; $result = null; $table = [];
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST') {
  $a_value = isset($_POST['a_value']) ? sanitize_float($_POST['a_value']) : null;
  $a_unit  = $_POST['a_unit'] ?? 'au';
  $e       = isset($_POST['e']) ? sanitize_float($_POST['e']) : null;
  $m_raw   = $_POST['masses'] ?? '1';
  $m_unit  = $_POST['m_unit'] ?? 'msun';
  $m_list  = parse_mass_list($m_raw);

  if ($a_value === null || $a_value <= 0) $errors[] = "Le demi-grand axe doit être positif.";
  if ($e === null || $e < 0 || $e >= 1)   $errors[] = "L’excentricité e doit être dans [0, 1).";
  if (!$m_list)                            $errors[] = "Indique au moins une masse stellaire.";

  if (!$errors) {
    $a_m   = a_to_m($a_value, $a_unit);
    $m_kg  = masses_to_kg($m_list, $m_unit);
    [$Mtot, $mu] = mu_from_stars($m_kg);
    if ($mu <= 0) $errors[] = "La somme des masses doit être > 0.";
    else {
      $T_s = 2.0*M_PI*sqrt(($a_m**3)/$mu);
      $T_days = $T_s/DAY_S; $T_years = $T_s/JULIAN_YEAR; $freq_Hz = 1.0/$T_s;
      $q_m = $a_m*(1.0-$e); $Q_m = $a_m*(1.0+$e);
      $dω_orbit_rad = 6.0*M_PI*G_SI*$Mtot / ($a_m*(1-$e*$e)*C_SI*C_SI);
      $dω_orbit_deg = $dω_orbit_rad * 180.0/M_PI;
      $dω_orbit_arc = $dω_orbit_deg * 3600.0;
      $Ncent = (100.0*JULIAN_YEAR)/$T_s;
      $dω_cent_deg = $dω_orbit_deg*$Ncent;
      $dω_cent_arc = $dω_orbit_arc*$Ncent;

      for ($y=0;$y<=100;$y++){
        $orbits = ($y*JULIAN_YEAR)/$T_s;
        $ω_deg = fmod($dω_orbit_deg*$orbits, 360.0); if ($ω_deg<0) $ω_deg+=360.0;
        $table[] = [
          'year'=>$y,
          'omega_deg'=>$ω_deg,
          'omega_arcsec'=>$ω_deg*3600.0,
          'q'=>m_to_unit($q_m,$a_unit),
          'Q'=>m_to_unit($Q_m,$a_unit),
        ];
      }
      $result = [
        'a_input'=>$a_value,'a_unit'=>$a_unit,'a_m'=>$a_m,'e'=>$e,
        'm_input'=>$m_list,'m_unit'=>$m_unit,'mtot_kg'=>$Mtot,'mu'=>$mu,
        'q_m'=>$q_m,'Q_m'=>$Q_m,'T_s'=>$T_s,'T_days'=>$T_days,'T_years'=>$T_years,'freq_Hz'=>$freq_Hz,
        'domega_orbit_deg'=>$dω_orbit_deg,'domega_orbit_arcsec'=>$dω_orbit_arc,
        'orbits_century'=>$Ncent,'domega_century_deg'=>$dω_cent_deg,'domega_century_arcsec'=>$dω_cent_arc,
      ];
    }
  }
}

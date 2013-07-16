<?php
/*
Plugin Name: Advanced Custom Fields - Image Grid
Plugin URI: 
Description: A collage of images in a grid 
Version: 1.0.0
Author: Seamus Leahy
Author URI: http://seamusleahy.com
License: MIT
*/


add_action('acf/register_fields', function() {
	require_once __DIR__ . '/acf_image_grid_value.class.php';
	require_once __DIR__ . '/acf_image_grid.class.php';
});	
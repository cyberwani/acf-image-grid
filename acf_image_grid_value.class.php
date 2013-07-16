<?php

class acf_image_grid_value {
	var $images;
	var $field;
	var $x;
	var $y;

	function __construct( $images, $field ) {
		$this->images = empty( $images ) ? array() : $images;
		$default_images = array();
		for ( $x=0; $x<$field['number_of_columns']; ++$x ) {
			for ( $y=0; $y<$field['number_of_rows']; ++$y ) {
				$default_images[ $x.','.$y ] = (object) array(
					'status' => 'empty',
					'image'  => null,
					'x'      => $x,
					'y'      => $y,
					'h'      => 1,
					'w'      => 1,
				);
			}
		}
		$this->images = (object) array_merge( $default_images, (array) $this->images );

		// Load up the image meta data
		foreach ( $this->images as $image ) {
			if ( isset( $image->image ) && is_int( $image->image ) ) {
				$image->image = json_decode( json_encode( wp_prepare_attachment_for_js( get_post( $image->image ) ) ) );
			}
		}

		$this->field = $field;
		$this->reset();
	}

	function reset() {
		$this->reset_row();
		$this->reset_col();
	}

	function has_row() {
		++$this->y;
		return $this->y < $this->field['number_of_rows'];
	}

	function has_col() {
		++$this->x;
		return $this->x < $this->field['number_of_columns'];
	}

	function reset_row() {
		$this->y = -1;
	}

	function reset_col() {
		$this->x = -1;
	}

	function current_cell() {
		return $this->get_cell( $this->x, $this->y );
	}

	function get_cell( $x, $y ) {
		$key = $x.','.$y;

		// Check if the cell is locked
		if ( isset($this->field['locked']->$key) && $this->field['locked']->$key ) {
			return (object) array(
				'status' => 'locked',
				'image'  => null,
				'x'      => $x,
				'y'      => $y,
				'w'      => 1,
				'h'      => 1,
			);
		}

		return $this->images->$key;
	}

	function toJSON() {
		$data = new stdClass;

		for( $x=0; $x<$this->field['number_of_columns']; ++$x ) {
			for( $y=0; $y<$this->field['number_of_rows']; ++$y ) {
				$key = $x.','.$y;
				$data->$key = $this->get_cell( $x, $y );
			}
		}

		return json_encode( $data );
	}

}
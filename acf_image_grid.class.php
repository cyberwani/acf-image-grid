<?php
class acf_image_grid extends acf_field
{
	// vars
	var $settings, // will hold info such as dir / path
		$defaults; // will hold default field options
		
		
	/*
	*  __construct
	*
	*  Set name / label needed for actions / filters
	*
	*  @since	3.6
	*  @date	23/01/13
	*/
	
	function __construct()
	{
		// vars
		$this->name = 'image_grid';
		$this->label = __('Image Grid');
		$this->category = __("Content",'acf'); // Basic, Content, Choice, etc
		$this->defaults = array(
			'number_of_rows' => 4,
			'number_of_columns' => 5,
			'locked' => array(),
		);
		
		
		// do not delete!
    	parent::__construct();
    	
    	
    	// settings
		$this->settings = array(
			'path' => apply_filters('acf/helpers/get_path', __FILE__),
			'dir' => apply_filters('acf/helpers/get_dir', __FILE__),
			'version' => '1.0.0'
		);
	}
	
	
	/*
	*  create_options()
	*
	*  Create extra options for your field. This is rendered when editing a field.
	*  The value of $field['name'] can be used (like bellow) to save extra data to the $field
	*
	*  @type	action
	*  @since	3.6
	*  @date	23/01/13
	*
	*  @param	$field	- an array holding all the field's data
	*/
	
	function create_options( $field )
	{
		// defaults?
		$field = array_merge($this->defaults, $field);
		
		// key is needed in the field names to correctly save the data
		$key = $field['name'];
		
		
		// Create Field Options HTML
		?>
<tr class="field_option field_option_<?php echo $this->name; ?>">
	<td class="label">
		<label><?php _e("Number of columns",'acf'); ?></label>
		<p class="description"><?php _e("The number of columns in the grid.",'acf'); ?></p>
	</td>
	<td>
		<?php
		
		do_action('acf/create_field', array(
			'type'		=>	'number',
			'name'		=>	'fields['.$key.'][number_of_columns]',
			'value'		=>	$field['number_of_columns'],
			'min'       =>  1
		));
		
		?>
	</td>
</tr>

<tr class="field_option field_option_<?php echo $this->name; ?>">
	<td class="label">
		<label><?php _e("Number of rows",'acf'); ?></label>
		<p class="description"><?php _e("The number of rows in the grid.",'acf'); ?></p>
	</td>
	<td>
		<?php
		
		do_action('acf/create_field', array(
			'type'		=>	'number',
			'name'		=>	'fields['.$key.'][number_of_rows]',
			'value'		=>	$field['number_of_rows'],
			'min'       =>  1
		));
		
		?>
	</td>
</tr>

<tr class="field_option field_option_<?php echo $this->name; ?>">
	<td class="label">
		<label><?php _e("Locked cells",'acf'); ?></label>
		<p class="description"><?php _e("Prevent images in the selected cells",'acf'); ?></p>
	</td>
	<td>
		<input type="hidden" name="<?php echo 'fields['.$key.'][locked]'; ?>" value="<?php echo esc_attr( json_encode( $field['locked'], JSON_FORCE_OBJECT ) ); ?>" data-widget="acf-image-grid-locked" data-number-of-rows="<?php echo esc_attr( 'fields['.$key.'][number_of_rows]' ); ?>" data-number-of-columns="<?php echo esc_attr( 'fields['.$key.'][number_of_columns]' ); ?>"/>
		<script>acfImageGrid.createLockedCellUISelector( 'input[name="fields[<?php echo esc_attr($key); ?>][locked]"]' );</script>
	</td>
</tr>

		<?php
		
	}
	
	
	/*
	*  create_field()
	*
	*  Create the HTML interface for your field
	*
	*  @param	$field - an array holding all the field's data
	*
	*  @type	action
	*  @since	3.6
	*  @date	23/01/13
	*/
	
	function create_field( $field )
	{
		// defaults?
		$field = array_merge($this->defaults, $field);
		
		// perhaps use $field['preview_size'] to alter the markup?
		
		
		// create Field HTML
		?>


		<div 
			data-widget="acf-image-grid-ui"
			class="acf-image-grid-ui"
			data-number-of-rows="<?php echo esc_attr( $field['number_of_rows']); ?>"
			data-number-of-columns="<?php echo esc_attr( $field['number_of_columns']); ?>"
			style="width: <?php echo esc_attr( $field['number_of_columns'] * 120 ); ?>px; height: <?php echo esc_attr( $field['number_of_rows'] * 120 ); ?>px;"
			id="<?php echo esc_attr($field['id']) ?>">
			<input class="acf-image-grid-value" type="hidden" value="<?php echo esc_attr( $field['value']->toJSON() ); ?>" name="<?php echo esc_attr( $field['name'] ) ?>" />

			<?php while( $field['value']->has_row() ): 
				$field['value']->reset_col();
				?>
				<?php while( $field['value']->has_col() ):
				$cell = $field['value']->current_cell();
				$style = 'left: ' . ($cell->x  * 120 ) . 'px; top: ' . ($cell->y  * 120 ) . 'px;';
				if ( $cell->status == 'filled' ) {
					$style .= 'width: ' . ($cell->w * 120 - 1) . 'px; height:' . ($cell->h*120 - 1) . 'px;';
				}
				?>
				<div
					class="acf-image-grid-cell status-<?php echo esc_attr( $cell->status ); ?>"
					data-x="<?php echo esc_attr( $cell->x ); ?>"
					data-y="<?php echo esc_attr( $cell->y ); ?>"
					style="<?php echo esc_attr( $style ); ?>"
					>

					<?php if ( $cell->status == 'locked' ): ?>
						<div class="locked"><?php _e( 'Locked' ); ?></div>
					<?php else: ?>
						<div class="empty">
							<button class="add-image button"><?php _e( 'Add Image', 'acf' ); ?></button>
						</div>
						<div class="image" <?php
							if ( isset( $cell->image->sizes->full->url ) ) {
								echo 'style=" background-image: url(\'', esc_attr($cell->image->sizes->full->url), '\');"';
							}
						?>>
						<nav class="action-menu">
							<a class="toggle">+</a>
							<ul>
								<li data-action="empty"><?php _e('Remove image', 'acf'); ?></li>
								<li data-action="change-image"><?php _e('Change image', 'acf'); ?></li>
							</ul>
						</nav>
						<div class="outline">
							<span class="handle handle-nw" data-x="-1" data-y="-1"></span>
							<span class="handle handle-n"  data-x="0"  data-y="-1"></span>
							<span class="handle handle-ne" data-x="1" data-y="-1"></span>
							<span class="handle handle-w"  data-x="-1" data-y="0"></span>
							<span class="handle handle-e"  data-x="1"  data-y="0"></span>
							<span class="handle handle-sw" data-x="-1" data-y="1"></span>
							<span class="handle handle-s"  data-x="0"  data-y="1"></span>
							<span class="handle handle-se" data-x="1"  data-y="1"></span>
						</div>
					</div>
					<?php endif; ?>
				</div>
				<?php endwhile; ?>
			<?php endwhile; ?>
		</div>
		<script>acfImageGrid.createlUi( '#<?php echo esc_attr($field['id']) ?>' );</script>
		<?php
	}
	
	
	/*
	*  input_admin_enqueue_scripts()
	*
	*  This action is called in the admin_enqueue_scripts action on the edit screen where your field is created.
	*  Use this action to add css + javascript to assist your create_field() action.
	*
	*  $info	http://codex.wordpress.org/Plugin_API/Action_Reference/admin_enqueue_scripts
	*  @type	action
	*  @since	3.6
	*  @date	23/01/13
	*/

	function input_admin_enqueue_scripts()
	{
		// Note: This function can be removed if not used
		
		wp_enqueue_media();

		// register acf scripts
		wp_register_script( 'jquery-event-drag', $this->settings['dir'] . '/vendor/jquery.event.drag-2.2.js', array('jquery'), $this->settings['version'] );
		wp_register_script( 'acf-image-grid', $this->settings['dir'] . 'input.js', array('acf-input', 'jquery', 'backbone', 'jquery-event-drag' ), $this->settings['version'] );
		wp_register_style( 'acf-image-grid', $this->settings['dir'] . 'input.css', array('acf-input'), $this->settings['version'] ); 
		
		
		// scripts
		wp_enqueue_script(array(
			'acf-image-grid',	
		));

		// styles
		wp_enqueue_style(array(
			'acf-image-grid',	
		));
		
		
	}
	
	
	/*
	*  input_admin_head()
	*
	*  This action is called in the admin_head action on the edit screen where your field is created.
	*  Use this action to add css and javascript to assist your create_field() action.
	*
	*  @info	http://codex.wordpress.org/Plugin_API/Action_Reference/admin_head
	*  @type	action
	*  @since	3.6
	*  @date	23/01/13
	*/

	function input_admin_head()
	{
		// Note: This function can be removed if not used
	}
	
	
	/*
	*  field_group_admin_enqueue_scripts()
	*
	*  This action is called in the admin_enqueue_scripts action on the edit screen where your field is edited.
	*  Use this action to add css + javascript to assist your create_field_options() action.
	*
	*  $info	http://codex.wordpress.org/Plugin_API/Action_Reference/admin_enqueue_scripts
	*  @type	action
	*  @since	3.6
	*  @date	23/01/13
	*/

	function field_group_admin_enqueue_scripts()
	{
		// Note: This function can be removed if not used
		wp_register_script( 'acf-image-grid-settings', $this->settings['dir'] . 'field-settings.js', array( 'jquery', 'backbone'), $this->settings['version'], false );
		wp_register_style( 'acf-image-grid-settings', $this->settings['dir'] . 'field-settings.css', array('acf-input'), $this->settings['version'] ); 
		
		
		// scripts
		wp_enqueue_script('acf-image-grid-settings');

		// styles
		wp_enqueue_style( 'acf-image-grid-settings');

	}

	
	/*
	*  field_group_admin_head()
	*
	*  This action is called in the admin_head action on the edit screen where your field is edited.
	*  Use this action to add css and javascript to assist your create_field_options() action.
	*
	*  @info	http://codex.wordpress.org/Plugin_API/Action_Reference/admin_head
	*  @type	action
	*  @since	3.6
	*  @date	23/01/13
	*/

	function field_group_admin_head()
	{
		
	}


	/*
	*  load_value()
	*
	*  This filter is appied to the $value after it is loaded from the db
	*
	*  @type	filter
	*  @since	3.6
	*  @date	23/01/13
	*
	*  @param	$value - the value found in the database
	*  @param	$post_id - the $post_id from which the value was loaded from
	*  @param	$field - the field array holding all the field options
	*
	*  @return	$value - the value to be saved in te database
	*/
	
	function load_value( $value, $post_id, $field )
	{
		// Note: This function can be removed if not used
		return $value;
	}
	
	
	/*
	*  update_value()
	*
	*  This filter is appied to the $value before it is updated in the db
	*
	*  @type	filter
	*  @since	3.6
	*  @date	23/01/13
	*
	*  @param	$value - the value which will be saved in the database
	*  @param	$post_id - the $post_id of which the value will be saved
	*  @param	$field - the field array holding all the field options
	*
	*  @return	$value - the modified value
	*/
	
	function update_value( $value, $post_id, $field )
	{
		$data = json_decode( $value );

		foreach ( $data as $image ) {
			if ( isset($image->image->id) ) {
				$image->image = $image->image->id;
			}
		}

		return $data;
	}
	
	
	/*
	*  format_value()
	*
	*  This filter is appied to the $value after it is loaded from the db and before it is passed to the create_field action
	*
	*  @type	filter
	*  @since	3.6
	*  @date	23/01/13
	*
	*  @param	$value	- the value which was loaded from the database
	*  @param	$post_id - the $post_id from which the value was loaded
	*  @param	$field	- the field array holding all the field options
	*
	*  @return	$value	- the modified value
	*/
	
	function format_value( $value, $post_id, $field )
	{
		return $this->format_value_for_api( $value, $post_id, $field );
	}
	
	
	/*
	*  format_value_for_api()
	*
	*  This filter is appied to the $value after it is loaded from the db and before it is passed back to the api functions such as the_field
	*
	*  @type	filter
	*  @since	3.6
	*  @date	23/01/13
	*
	*  @param	$value	- the value which was loaded from the database
	*  @param	$post_id - the $post_id from which the value was loaded
	*  @param	$field	- the field array holding all the field options
	*
	*  @return	$value	- the modified value
	*/
	
	function format_value_for_api( $value, $post_id, $field )
	{
		return new acf_image_grid_value( $value, $field );
	}
	
	
	/*
	*  load_field()
	*
	*  This filter is appied to the $field after it is loaded from the database
	*
	*  @type	filter
	*  @since	3.6
	*  @date	23/01/13
	*
	*  @param	$field - the field array holding all the field options
	*
	*  @return	$field - the field array holding all the field options
	*/
	
	function load_field( $field )
	{
		// Note: This function can be removed if not used
		return $field;
	}
	
	
	/*
	*  update_field()
	*
	*  This filter is appied to the $field before it is saved to the database
	*
	*  @type	filter
	*  @since	3.6
	*  @date	23/01/13
	*
	*  @param	$field - the field array holding all the field options
	*  @param	$post_id - the field group ID (post_type = acf)
	*
	*  @return	$field - the modified field
	*/

	function update_field( $field, $post_id )
	{
		$number_of_rows = $field['number_of_rows'];
		$number_of_columns = $field['number_of_columns'];

		$locked = json_decode( stripcslashes( $field['locked'] ), true  );

		if ( empty($locked) ) {
			$locked = array();
		}

		// Remove locked cells that are out of bounds
		foreach( $locked as $key => $v ) {
			$xy = explode( ',', $key );

			if ( count($xy) != 2 || (int)$xy[0] >= $number_of_columns || (int)$xy[1] >= $number_of_rows ) {
				unset( $locked[$key] );
			}
		}
		$field['locked'] = $locked;

		return $field;
	}

	
}


// create field
new acf_image_grid();
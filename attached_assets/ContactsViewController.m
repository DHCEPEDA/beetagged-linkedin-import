//
//  ContactsViewController.m
//  Bees Chest
//
//  Created by Billy Irwin on 1/1/14.
//  Copyright (c) 2014 Arbrr. All rights reserved.
//

#import "ContactsViewController.h"
#import "Contact.h"
#import "TagCell.h"
#import "UIColor+Bee.h"

@interface ContactsViewController ()

@end

@implementation ContactsViewController

- (id)initWithNibName:(NSString *)nibNameOrNil bundle:(NSBundle *)nibBundleOrNil {
    self = [super initWithNibName:nibNameOrNil bundle:nibBundleOrNil];
    if (self) {
        // Custom initialization
    }
    return self;
}

- (void)viewDidLoad
{
    [super viewDidLoad];
    self.ContactTableView.delegate = self;
    self.ContactTableView.dataSource = self;
    FBManager *lim = [FBManager singleton];
    if (!lim.hasContacts) {
        [lim refreshContacts];
    }
    self.ContactTableView.clipsToBounds = YES;
    self.ContactTableView.sectionIndexColor = [UIColor goldBeeColor];
    [self.ContactTableView reloadData];
    
    self.searchBar.delegate = self;
    self.navigationController.interactivePopGestureRecognizer.enabled = NO; // make sure we can't swipe to logout
    self.tagFilterView.backgroundColor = [UIColor cloudsColor];
    
    // customize the beeButton
    [self.beeButton setBackgroundColor:[UIColor goldBeeColor]];
    self.beeButton.layer.cornerRadius = 2.0;
    self.beeButton.titleLabel.font = [UIFont fontWithName:@"HelveticaNeue-Bold" size:18.0];
    [self.beeButton addTarget:self action:@selector(newTag:) forControlEvents:UIControlEventTouchUpInside];
    
    self.tagTableView.backgroundColor = [UIColor clearColor];
    self.tagTableView.delegate = self;
    self.tagTableView.dataSource = self;
    
    [self.view addSubview:self.tagFilterView];

    self.tagFilters = [[NSMutableArray alloc] init];
    self.searchBar.tintColor = [UIColor goldBeeColor];
    
    self.networkButton.backgroundColor = [UIColor goldBeeColor];
    [self.networkButton setTintColor:[UIColor whiteColor]];
    [self.networkButton addTarget:self action:@selector(networkSearch) forControlEvents:UIControlEventTouchUpInside];
    
    [self typeahead];
}

- (void)networkSearch {
    FBManager *fb = [FBManager singleton];
    [fb filterForTagsFromNetwork:self.tagFilters cb:^{
        [self.ContactTableView reloadData];
    }];
}

- (void)typeahead {
    float top = 70.0, left = 20.0, height = 180.0;
    self.typeAheadViewController = [[BATypeAheadViewController alloc] initWithFrame:CGRectMake(left, top, 180, height) andData:[[FBManager singleton] tagOptionsArray]];
    self.typeAheadViewController.delegate = self;
    self.typeAheadViewController.view.layer.cornerRadius = 10.0;
    self.typeAheadViewController.view.backgroundColor = [UIColor whiteColorWithAlpha:.9];
    self.typeAheadViewController.view.tableView.backgroundColor = [UIColor clearColor];
    [self.typeAheadViewController hideView:NO];
    [self addChildViewController:self.typeAheadViewController];
    self.typeAheadViewController.delegate = self;
    [self.tagFilterView addSubview:self.typeAheadViewController.view];
}

- (void)didReceiveMemoryWarning
{
    [super didReceiveMemoryWarning];
    // Dispose of any resources that can be recreated.
}

- (void)viewWillAppear:(BOOL)animated {
    [super viewWillAppear:animated];
    self.navigationController.navigationBar.hidden = YES;
}

//code below is used to query contacts on the phone by first and last name
#pragma mark - UISearchBarDelegate
- (void)searchBar:(UISearchBar *)searchBar textDidChange:(NSString *)searchText {
    //handle basecase of empty string
    if ([searchText isEqualToString:@""]) {
        [[FBManager singleton] search:@""];
        [self.ContactTableView reloadData];
    }
}

- (BOOL)searchBar:(UISearchBar *)searchBar shouldChangeTextInRange:(NSRange)range replacementText:(NSString *)text {
    NSLog(@"%@", text);
    NSString *query = [NSString stringWithFormat:@"%@%@", searchBar.text, text];
    if ([text isEqualToString:@""]) {
        //handle backspace
        query = [query substringToIndex:query.length-1];
    } else if ([text isEqualToString:@"\n"]) {
        // Search Pressed
        [searchBar resignFirstResponder];
        return NO;
    }
    query = [query stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceCharacterSet]];
    NSLog(@"%@", query);
    [[FBManager singleton] search:query];
    [self.ContactTableView reloadData];
    return YES;
}

- (void)searchBarTextDidBeginEditing:(UISearchBar *)searchBar {
    searchBar.showsCancelButton = YES;
}

- (void)searchBarTextDidEndEditing:(UISearchBar *)searchBar {
    searchBar.showsCancelButton = ![searchBar.text isEqualToString:@""];
}

//when canceled, clear search, hide keyboard
- (void)searchBarCancelButtonClicked:(UISearchBar *)searchBar {
    searchBar.text = @"";
    [searchBar resignFirstResponder];
    [[FBManager singleton] search:@""];
    [self.ContactTableView reloadData];
}


#pragma mark - Table view data source

// returns the number of groupings in the table view if the user is not searching,
// but returns 1 if the user is searching
- (NSInteger)numberOfSectionsInTableView:(UITableView *)tableView {
    if (tableView == self.ContactTableView) {
        NSInteger numberOfSections = 1;
        FBManager *lim = [FBManager singleton];
        if (!lim.search && !lim.tagFilter) {
            numberOfSections = [lim.fetchedResultsController.sections count];
        }
        return numberOfSections;
    }
    return 1;
}

// returns the number of rows in the given section based on whether or not
// we are searching or not.
-(NSInteger)tableView:(UITableView *)tableView numberOfRowsInSection:(NSInteger)section {
    if (tableView == self.ContactTableView) {
        FBManager *lim = [FBManager singleton];
        NSInteger numberOfRows = 0;
        if (lim.search) {
            numberOfRows = lim.searchArray.count;
        } else if (lim.tagFilter) {
            numberOfRows = lim.filterArray.count;
        } else {
            id <NSFetchedResultsSectionInfo> sectionInfo = [[lim.fetchedResultsController sections] objectAtIndex:section];
            numberOfRows = [sectionInfo numberOfObjects];
        }
        return numberOfRows;
    }
    return self.tagFilters.count;
}


- (IBAction)removeTag:(UIButton *)sender {
    UITableViewCell *cell = (UITableViewCell *)sender.superview.superview.superview;
    while (cell && [cell class] == [UITableViewCell class]) {
        cell = (UITableViewCell *)cell.superview;
    }
    
    NSIndexPath *indexPathForCell = [self.tagTableView indexPathForCell:cell];
    [self.tagFilters removeObjectAtIndex:indexPathForCell.row];
    [self.tagTableView reloadData];
    [self renderFilter];
}

// returns the title for the header in the section. It will not give a header
// (because title is nil) if the tableView is searching
-(NSString *)tableView:(UITableView *)tableView titleForHeaderInSection:(NSInteger)section {
    if (tableView == self.ContactTableView) {
        FBManager *lim = [FBManager singleton];
        NSString *title = nil;
        
        if (!lim.search &&  [[lim.fetchedResultsController sections] count] > 0 && !lim.tagFilter) {
            id <NSFetchedResultsSectionInfo> sectionInfo = [[lim.fetchedResultsController sections] objectAtIndex:section];
            title = [sectionInfo name];
        }
        return title;
    }
    return @"";
}

// shows the sectionIndexTitles if the tableView is grouped.
-(NSArray *)sectionIndexTitlesForTableView:(UITableView *)tableView {
    if (tableView == self.ContactTableView) {
        FBManager *lim = [FBManager singleton];
        NSArray *sectionIndexTitles = nil;
        if (!lim.search && !lim.tagFilter) {
            sectionIndexTitles = [lim.fetchedResultsController sectionIndexTitles];
        }
        return sectionIndexTitles;
    }
    return @[];
}

// tells the tableView which section to jump to when the index side bar is clicked.
-(NSInteger)tableView:(UITableView *)tableView sectionForSectionIndexTitle:(NSString *)title atIndex:(NSInteger)index {
    if (tableView == self.ContactTableView) {
        FBManager *lim = [FBManager singleton];
        NSInteger section = 0;
        if (!lim.search && !lim.tagFilter) {
            section = [lim.fetchedResultsController sectionForSectionIndexTitle:title atIndex:index];
        }
        return section;
    }
    return 0;
}

- (UITableViewCell *)tableView:(UITableView *)tableView cellForRowAtIndexPath:(NSIndexPath *)indexPath {
    if (tableView == self.ContactTableView) {
        UITableViewCell *cell;
        cell = [tableView dequeueReusableCellWithIdentifier:kContactCell forIndexPath:indexPath];
        if (!cell) {
            cell = [[UITableViewCell alloc] initWithStyle:UITableViewCellStyleDefault reuseIdentifier:kContactCell];
        }
        FBManager *lim = [FBManager singleton];
        Contact *contact;
        
        if (lim.search) {
            contact = [lim.searchArray objectAtIndex:indexPath.row];
        } else if (lim.tagFilter) {
            contact = [[lim.filterArray objectAtIndex:indexPath.row] objectForKey:@"contact"];
        } else {
            contact = [lim.fetchedResultsController objectAtIndexPath:indexPath];
        }
        
        UILabel *nameLabel = (UILabel*)[cell viewWithTag:1];
        nameLabel.text = [NSString stringWithFormat:@"%@ %@", contact.first_name, contact.last_name];
        
        UILabel *homeLabel = (UILabel *)[cell viewWithTag:3];
        homeLabel.text = contact.hometown;
        
        
        NSArray *workArray = [contact detailAttributesFor:kContactWork];
        NSArray *educationArray = [contact detailAttributesFor:kContactEducation];
        
        
        NSLog(@"%i %i", workArray.count, educationArray.count);
        
        UILabel *workLabel = (UILabel *)[cell viewWithTag:4];
        if (contact.work.count > 0) {
            NSDictionary *d = contact.work[0];
            workLabel.text = [NSString stringWithFormat:@"%@", d[kContactEmployer]];
        } else {
            workLabel.text = nil;
        }
        UILabel *schoolLabel = (UILabel *)[cell viewWithTag:5];
        if (contact.education.count > 0) {
            NSDictionary *d = contact.education[0];
            schoolLabel.text = [NSString stringWithFormat:@"%@", d[kContactSchool]];
            NSLog(@"%i %@", contact.education.count, d);
        } else {
            schoolLabel.text = nil;
        }
        
        UIImageView *imageView = (UIImageView*)[cell viewWithTag:2];
        [imageView setImageWithURL:[NSURL URLWithString:contact.pictureUrl] placeholderImage:kContactCellPlaceholderImage];
        
        return cell;
    } else if (tableView == self.tagTableView) {
        static NSString *tagCellIdentifier = @"TagFilterCell";
        UITableViewCell *cell = [tableView dequeueReusableCellWithIdentifier:tagCellIdentifier forIndexPath:indexPath];
        

        cell.textLabel.text = @"";
        UILabel *label = (UILabel *)[cell viewWithTag:2];
        label.text = self.tagFilters[indexPath.row];
        
        UIButton *button = (UIButton *)[cell viewWithTag:1];
        [button setTintColor:[UIColor redColor]];
        [button addTarget:self action:@selector(removeTag:) forControlEvents:UIControlEventTouchUpInside];
        cell.backgroundColor = [UIColor clearColor];
        
        return cell;
    }
    return nil;
}

- (void)setIndexTitlesColor {
    for (UIView *view in [self.tagTableView subviews]) {
        if([[[view class] description] isEqualToString:@"UITableViewIndex"]) {
            [view setBackgroundColor:[UIColor goldBeeColor]];
        }
    }
}

// either selects a contact or removes a tag depending on tableview selected
-(void)tableView:(UITableView *)tableView didSelectRowAtIndexPath:(NSIndexPath *)indexPath {
    if (tableView == self.ContactTableView) {
        [self performSegueWithIdentifier:kShowContactSegue sender:self];
        [tableView deselectRowAtIndexPath:indexPath animated:YES];
    } else if (tableView == self.tagTableView) {
        [self.tagFilters removeObjectAtIndex:indexPath.row];
        [self renderFilter];
    }
}


// perform necessary logic to render a contact on the single contacts screen
-(void)prepareForSegue:(UIStoryboardSegue *)segue sender:(id)sender {
    if ([segue.identifier isEqualToString:kShowContactSegue]) {
        FBManager *lim = [FBManager singleton];
         NSIndexPath *indexPath = [self.ContactTableView indexPathForSelectedRow];
        Contact *contact;
        if (lim.search) {
            contact = [lim.searchArray objectAtIndex:indexPath.row];
        } else if (lim.tagFilter) {
            contact = [[lim.filterArray objectAtIndex:indexPath.row] objectForKey:@"contact"];
        } else {
            contact = [lim.fetchedResultsController objectAtIndexPath:indexPath];
        }
        ContactViewController *cvc = (ContactViewController *)[segue destinationViewController];
        cvc.isCurrentUser = NO;
        [cvc renderContact:contact];
    }
}

- (CGFloat)tableView:(UITableView *)tableView heightForRowAtIndexPath:(NSIndexPath *)indexPath {
    return 125;
}

//show or hide tag filter view
- (IBAction)filterTags:(id)sender {
    if (!self.typeAheadViewController.data) {
        self.typeAheadViewController.data = [[FBManager singleton] tagOptionsArray];
    }
    if (self.tagFilterView.frame.origin.x > 300) {
        [UIView animateWithDuration:0.5 animations:^{
            self.tagFilterView.frame = CGRectMake(100, 64, 220, kHeight-100);
        }];
    } else {
        [self.typeAheadViewController hideView:YES];
        [UIView animateWithDuration:0.5 animations:^{
            self.tagFilterView.frame = CGRectMake(320, 64, 220, kHeight-100);
        }];
    }
}

//callback function from BATypeAheadViewController, adds a new tag
- (void)cellClickedWithData:(id)data {
    TagOption *t = (TagOption*)data;
    [self.tagFilters addObject:t.attributeName];
    [self.typeAheadViewController hideView:YES];
    [self.tagTableView reloadData];
    [self renderFilter];

}

//query FBManager.tagindex for correct contacts
- (void)renderFilter {
    FBManager *fb = [FBManager singleton];
    fb.search = NO;
    fb.tagFilter = YES;
    [fb filterForTags:self.tagFilters];
    [self.ContactTableView reloadData];
}

- (IBAction)newTag:(id)sender {
    [self.typeAheadViewController showView:YES];
}

- (void)scrollViewDidScroll:(UIScrollView *)scrollView {
    [self backgroundTouched:nil];
}

@end
